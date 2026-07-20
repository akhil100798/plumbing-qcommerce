package com.pqc.core.service;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PlumberMaterialService {
    private final ServiceOrderRepository jobs;
    private final ProductOrderRepository requests;
    private final ProductRepository products;
    private final StoreRepository stores;
    private final StockRepository stocks;
    private final InventoryReservationRepository reservations;
    private final ProductOrderStatusHistoryRepository historyRepo;
    private final CurrentUser currentUser;

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @Transactional
    public MaterialRequestDetailResponse createMaterialRequest(Long jobId, Long storeId, List<CartItemDTO> inputs) {
        User plumber = role(Role.PLUMBER);
        ServiceOrder job = jobs.findById(jobId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Service order not found"));
        if (job.getPlumber() == null || !Objects.equals(job.getPlumber().getId(), plumber.getId()))
            throw new AccessDeniedException("Only the assigned plumber can request materials");
        if (!Set.of(OrderStatus.IN_PROGRESS, OrderStatus.WORK_RESUMED).contains(job.getStatus()))
            throw error(HttpStatus.CONFLICT, "Materials require an active job");
        if (inputs == null || inputs.isEmpty()) throw error(HttpStatus.BAD_REQUEST, "At least one product is required");
        Store store = stores.findById(storeId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Store not found"));
        ProductOrder request = ProductOrder.builder().customer(job.getCustomer()).store(store).serviceOrder(job)
                .requestedByPlumber(plumber).status(ProductOrderStatus.REQUESTED).totalAmount(BigDecimal.ZERO).build();
        List<ProductOrderItem> items = new ArrayList<>();
        Set<Long> unique = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (CartItemDTO input : inputs) {
            validate(input, unique);
            Product product = products.findById(input.getProductId()).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Product not found"));
            stocks.findByStoreIdAndProductId(storeId, product.getId())
                    .orElseThrow(() -> error(HttpStatus.BAD_REQUEST, "Selected store does not stock product " + product.getId()));
            items.add(ProductOrderItem.builder().order(request).product(product).quantity(input.getQuantity())
                    .reservedQuantity(0).price(product.getPrice()).build());
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(input.getQuantity())));
        }
        request.setItems(items); request.setTotalAmount(total);
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), null, ProductOrderStatus.REQUESTED, plumber, null);
        job.setStore(store); job.setStatus(OrderStatus.MATERIALS_REQUIRED); jobs.save(job);
        return toDetail(saved);
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────

    @Transactional
    public MaterialRequestDetailResponse updateMaterialRequest(Long id, Long storeId, List<CartItemDTO> inputs) {
        ProductOrder request = material(id);
        User plumber = role(Role.PLUMBER);
        if (request.getRequestedByPlumber() == null || !Objects.equals(request.getRequestedByPlumber().getId(), plumber.getId()))
            throw new AccessDeniedException("Material request belongs to another plumber");
        if (request.getStatus() != ProductOrderStatus.REQUESTED)
            throw error(HttpStatus.CONFLICT, "Request can only be updated before store review (current: " + request.getStatus() + ")");
        if (inputs == null || inputs.isEmpty()) throw error(HttpStatus.BAD_REQUEST, "At least one product is required");
        Store store = stores.findById(storeId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Store not found"));

        // Replace items
        request.getItems().clear();
        Set<Long> unique = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (CartItemDTO input : inputs) {
            validate(input, unique);
            Product product = products.findById(input.getProductId()).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Product not found"));
            stocks.findByStoreIdAndProductId(storeId, product.getId())
                    .orElseThrow(() -> error(HttpStatus.BAD_REQUEST, "Selected store does not stock product " + product.getId()));
            request.getItems().add(ProductOrderItem.builder().order(request).product(product)
                    .quantity(input.getQuantity()).reservedQuantity(0).price(product.getPrice()).build());
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(input.getQuantity())));
        }
        request.setStore(store);
        request.setTotalAmount(total);
        // Update service order store if changed
        if (!Objects.equals(request.getServiceOrder().getStore() == null ? null : request.getServiceOrder().getStore().getId(), storeId)) {
            request.getServiceOrder().setStore(store);
            jobs.save(request.getServiceOrder());
        }
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), ProductOrderStatus.REQUESTED, ProductOrderStatus.REQUESTED, plumber, "Updated by plumber");
        return toDetail(saved);
    }

    // ─── CANCEL ──────────────────────────────────────────────────────────────

    @Transactional
    public MaterialRequestDetailResponse cancelMaterialRequest(Long id, String reason) {
        User actor = currentUser.require();
        ProductOrder request = material(id);

        // Role-aware permission
        boolean isPlumber = actor.getRole() == Role.PLUMBER
                && request.getRequestedByPlumber() != null
                && Objects.equals(request.getRequestedByPlumber().getId(), actor.getId());
        boolean isStoreManager = actor.getRole() == Role.STORE_MANAGER
                && Objects.equals(request.getStore().getManager().getId(), actor.getId());
        boolean isAdmin = admin(actor);

        if (!isPlumber && !isStoreManager && !isAdmin)
            throw new AccessDeniedException("Not authorized to cancel this request");

        // Cannot cancel after collection
        if (request.getStatus() == ProductOrderStatus.COLLECTED)
            throw error(HttpStatus.CONFLICT, "Cannot cancel a request after collection");
        if (request.getStatus() == ProductOrderStatus.CANCELLED)
            throw error(HttpStatus.CONFLICT, "Request is already cancelled");

        ProductOrderStatus prev = request.getStatus();

        // Release reserved inventory if stock was reserved
        if (request.getStatus() == ProductOrderStatus.RESERVED
                || request.getStatus() == ProductOrderStatus.PREPARING
                || request.getStatus() == ProductOrderStatus.READY_FOR_PICKUP
                || request.getStatus() == ProductOrderStatus.PLUMBER_AT_STORE) {
            releaseReservations(request);
        }

        request.setStatus(ProductOrderStatus.CANCELLED);
        request.setNotes(reason != null ? reason : request.getNotes());

        // Restore service order state
        ServiceOrder job = request.getServiceOrder();
        if (job != null && Set.of(OrderStatus.WAITING_FOR_STORE, OrderStatus.MATERIALS_REQUIRED,
                OrderStatus.READY_FOR_PRODUCT_PICKUP, OrderStatus.PLUMBER_COLLECTING_PRODUCTS).contains(job.getStatus())) {
            job.setStatus(OrderStatus.IN_PROGRESS);
            jobs.save(job);
        }

        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.CANCELLED, actor, reason);
        return toDetail(saved);
    }

    private void releaseReservations(ProductOrder request) {
        for (InventoryReservation res : reservations.findByOrderId(request.getId())) {
            if (res.getStatus() != ReservationStatus.CONFIRMED) continue;
            Stock stock = stocks.findForUpdateByStoreIdAndProductId(
                    request.getStore().getId(), res.getStock().getProduct().getId()).orElse(null);
            if (stock != null && stock.getReservedQuantity() >= res.getQuantity()) {
                stock.setReservedQuantity(stock.getReservedQuantity() - res.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() + res.getQuantity());
                stocks.save(stock);
            }
            res.setStatus(ReservationStatus.RELEASED);
            reservations.save(res);
        }
    }

    // ─── STATUS HISTORY ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MaterialStatusHistoryResponse> getHistory(Long id) {
        User actor = currentUser.require();
        ProductOrder request = material(id);
        // Access: plumber of request, store manager of request, or admin
        boolean allowed = admin(actor)
                || (request.getRequestedByPlumber() != null && Objects.equals(request.getRequestedByPlumber().getId(), actor.getId()))
                || Objects.equals(request.getStore().getManager().getId(), actor.getId())
                || (request.getCustomer() != null && Objects.equals(request.getCustomer().getId(), actor.getId()));
        if (!allowed) throw new AccessDeniedException("Not authorized to view this request's history");
        return historyRepo.findByProductOrderIdOrderByCreatedAtAsc(id)
                .stream().map(h -> new MaterialStatusHistoryResponse(
                        h.getId(), h.getPreviousStatus(), h.getNewStatus(),
                        h.getActorId(), h.getActorRole(), h.getReason(), h.getCreatedAt()))
                .toList();
    }

    // ─── SUBMIT ──────────────────────────────────────────────────────────────

    @Transactional
    public MaterialRequestDetailResponse submit(Long id) {
        ProductOrder request = plumberRequestEntity(id);
        User plumber = role(Role.PLUMBER);
        ProductOrderStatus prev = request.getStatus();
        move(request, ProductOrderStatus.REQUESTED, ProductOrderStatus.STORE_REVIEWING);
        request.getServiceOrder().setStatus(OrderStatus.WAITING_FOR_STORE);
        jobs.save(request.getServiceOrder());
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.STORE_REVIEWING, plumber, null);
        return toDetail(saved);
    }

    // ─── LIST (returns DTOs) ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MaterialRequestSummaryResponse> plumberRequests() {
        User plumber = role(Role.PLUMBER);
        return requests.findByServiceOrder_Plumber_Id(plumber.getId())
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<MaterialRequestSummaryResponse> storeRequests() {
        User manager = role(Role.STORE_MANAGER);
        return requests.findByStore_Manager_IdAndServiceOrderIsNotNull(manager.getId())
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public MaterialRequestDetailResponse plumberRequestDetails(Long id) {
        return toDetail(plumberRequestEntity(id));
    }

    @Transactional(readOnly = true)
    public MaterialRequestDetailResponse storeRequestDetails(Long id) {
        return toDetail(storeRequestEntity(id));
    }

    @Transactional(readOnly = true)
    public List<MaterialRequestSummaryResponse> serviceOrderRequests(Long jobId) {
        User actor = currentUser.require();
        ServiceOrder job = jobs.findById(jobId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Service order not found"));
        boolean allowed = admin(actor) || Objects.equals(job.getCustomer().getId(), actor.getId())
                || job.getPlumber() != null && Objects.equals(job.getPlumber().getId(), actor.getId());
        if (!allowed) throw new AccessDeniedException("Service order belongs to another user");
        return requests.findByServiceOrderId(jobId).stream().map(this::toSummary).toList();
    }

    // ─── STORE ACTIONS ───────────────────────────────────────────────────────

    @Transactional
    public MaterialRequestDetailResponse approve(Long id, Map<Long, Integer> quantities) {
        ProductOrder request = storeRequestEntity(id);
        User manager = role(Role.STORE_MANAGER);
        if (request.getStatus() != ProductOrderStatus.STORE_REVIEWING)
            throw error(HttpStatus.CONFLICT, "Request is not awaiting review");
        boolean partial = false;
        for (ProductOrderItem item : request.getItems()) {
            int quantity = quantities == null ? item.getQuantity() : quantities.getOrDefault(item.getProduct().getId(), 0);
            if (quantity < 0 || quantity > item.getQuantity()) throw error(HttpStatus.BAD_REQUEST, "Invalid approved quantity");
            item.setReservedQuantity(quantity); partial |= quantity < item.getQuantity();
        }
        if (request.getItems().stream().allMatch(i -> i.getReservedQuantity() == 0))
            throw error(HttpStatus.BAD_REQUEST, "Approve at least one item");
        ProductOrderStatus newStatus = partial ? ProductOrderStatus.PARTIALLY_AVAILABLE : ProductOrderStatus.APPROVED;
        ProductOrderStatus prev = request.getStatus();
        request.setStatus(newStatus);
        request.setStoreConfirmedAt(LocalDateTime.now());
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, newStatus, manager, null);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse reject(Long id, String reason) {
        ProductOrder request = storeRequestEntity(id);
        User manager = role(Role.STORE_MANAGER);
        ProductOrderStatus prev = request.getStatus();
        move(request, ProductOrderStatus.STORE_REVIEWING, ProductOrderStatus.REJECTED);
        request.setNotes(reason);
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.REJECTED, manager, reason);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse reserve(Long id) {
        ProductOrder request = storeRequestEntity(id);
        User manager = role(Role.STORE_MANAGER);
        if (!Set.of(ProductOrderStatus.APPROVED, ProductOrderStatus.PARTIALLY_AVAILABLE).contains(request.getStatus()))
            throw error(HttpStatus.CONFLICT, "Only an approved request can be reserved");
        for (ProductOrderItem item : request.getItems()) {
            int quantity = item.getReservedQuantity();
            if (quantity == 0) continue;
            Stock stock = stocks.findForUpdateByStoreIdAndProductId(request.getStore().getId(), item.getProduct().getId())
                    .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Stock not found"));
            if (stock.getAvailableQuantity() < quantity) throw error(HttpStatus.CONFLICT, "Insufficient stock for product " + item.getProduct().getId());
            stock.setAvailableQuantity(stock.getAvailableQuantity() - quantity);
            stock.setReservedQuantity(stock.getReservedQuantity() + quantity);
            stocks.save(stock);
            // Prevent duplicate reservation
            boolean alreadyReserved = reservations.findByOrderId(id).stream()
                    .anyMatch(r -> r.getStatus() == ReservationStatus.CONFIRMED
                            && Objects.equals(r.getStock().getId(), stock.getId()));
            if (!alreadyReserved) {
                reservations.save(InventoryReservation.builder().customer(request.getCustomer()).stock(stock).order(request)
                        .quantity(quantity).status(ReservationStatus.CONFIRMED).expiresAt(LocalDateTime.now().plusDays(7)).build());
            }
        }
        ProductOrderStatus prev = request.getStatus();
        request.setStatus(ProductOrderStatus.RESERVED);
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.RESERVED, manager, null);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse prepare(Long id) {
        ProductOrder request = storeRequestEntity(id);
        User manager = role(Role.STORE_MANAGER);
        ProductOrderStatus prev = request.getStatus();
        move(request, ProductOrderStatus.RESERVED, ProductOrderStatus.PREPARING);
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.PREPARING, manager, null);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse ready(Long id) {
        ProductOrder request = storeRequestEntity(id);
        User manager = role(Role.STORE_MANAGER);
        ProductOrderStatus prev = request.getStatus();
        move(request, ProductOrderStatus.PREPARING, ProductOrderStatus.READY_FOR_PICKUP);
        request.getServiceOrder().setStatus(OrderStatus.READY_FOR_PRODUCT_PICKUP);
        jobs.save(request.getServiceOrder());
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.READY_FOR_PICKUP, manager, null);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse arrived(Long id) {
        ProductOrder request = plumberRequestEntity(id);
        User plumber = role(Role.PLUMBER);
        ProductOrderStatus prev = request.getStatus();
        move(request, ProductOrderStatus.READY_FOR_PICKUP, ProductOrderStatus.PLUMBER_AT_STORE);
        request.setPlumberArrivedAt(LocalDateTime.now());
        request.getServiceOrder().setStatus(OrderStatus.PLUMBER_COLLECTING_PRODUCTS);
        jobs.save(request.getServiceOrder());
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.PLUMBER_AT_STORE, plumber, null);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse collect(Long id) {
        ProductOrder request = plumberRequestEntity(id);
        User plumber = role(Role.PLUMBER);
        if (request.getStatus() != ProductOrderStatus.PLUMBER_AT_STORE || request.getPlumberCollectedAt() != null)
            throw error(HttpStatus.CONFLICT, "Collection is not allowed or was already recorded");
        ProductOrderStatus prev = request.getStatus();
        request.setPlumberCollectedAt(LocalDateTime.now());
        request.setCollectedByPlumber(currentUser.require());
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.PLUMBER_AT_STORE, plumber, "Plumber collected products");
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse confirmCollection(Long id) {
        ProductOrder request = storeRequestEntity(id);
        User manager = role(Role.STORE_MANAGER);
        if (request.getStatus() != ProductOrderStatus.PLUMBER_AT_STORE || request.getPlumberCollectedAt() == null)
            throw error(HttpStatus.CONFLICT, "Assigned plumber must record collection first");
        List<InventoryReservation> activeReservations = reservations.findByOrderId(id);
        for (InventoryReservation reservation : activeReservations) {
            if (reservation.getStatus() != ReservationStatus.CONFIRMED)
                throw error(HttpStatus.CONFLICT, "Collection already finalized");
            Stock stock = stocks.findForUpdateByStoreIdAndProductId(request.getStore().getId(), reservation.getStock().getProduct().getId()).orElseThrow();
            if (stock.getReservedQuantity() < reservation.getQuantity())
                throw error(HttpStatus.CONFLICT, "Reserved stock is inconsistent");
            stock.setReservedQuantity(stock.getReservedQuantity() - reservation.getQuantity());
            stocks.save(stock);
            reservation.setStatus(ReservationStatus.COMPLETED);
            reservations.save(reservation);
        }
        ProductOrderStatus prev = request.getStatus();
        request.setStatus(ProductOrderStatus.COLLECTED);
        request.setCollectionConfirmedAt(LocalDateTime.now());
        request.getServiceOrder().setStatus(OrderStatus.PRODUCTS_COLLECTED);
        jobs.save(request.getServiceOrder());
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.COLLECTED, manager, null);
        return toDetail(saved);
    }

    @Transactional
    public ServiceOrder returning(Long jobId) {
        ServiceOrder job = assignedJob(jobId);
        if (job.getStatus() != OrderStatus.PRODUCTS_COLLECTED)
            throw error(HttpStatus.CONFLICT, "Products must be collected first");
        job.setStatus(OrderStatus.RETURNING_TO_CUSTOMER);
        return jobs.save(job);
    }

    @Transactional
    public ServiceOrder resume(Long jobId) {
        ServiceOrder job = assignedJob(jobId);
        if (job.getStatus() != OrderStatus.RETURNING_TO_CUSTOMER)
            throw error(HttpStatus.CONFLICT, "Plumber must be returning to customer");
        job.setStatus(OrderStatus.WORK_RESUMED);
        return jobs.save(job);
    }

    // ─── ADMIN ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<MaterialRequestSummaryResponse> adminList(
            String status, Long storeId, Long plumberId, Long customerId, Long serviceOrderId,
            int page, int size) {
        requireAdmin();
        PageRequest pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ProductOrder> raw = requests.findAll((root, q, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (status != null) predicates.add(cb.equal(root.get("status").as(String.class), status));
            if (storeId != null) predicates.add(cb.equal(root.get("store").get("id"), storeId));
            if (plumberId != null) predicates.add(cb.equal(root.get("requestedByPlumber").get("id"), plumberId));
            if (customerId != null) predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            if (serviceOrderId != null) predicates.add(cb.equal(root.get("serviceOrder").get("id"), serviceOrderId));
            predicates.add(root.get("serviceOrder").isNotNull()); // only material requests
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, pr);
        return raw.map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public MaterialRequestDetailResponse adminDetail(Long id) {
        requireAdmin();
        return toDetail(material(id));
    }

    @Transactional
    public MaterialRequestDetailResponse adminCancel(Long id, String reason) {
        requireAdmin();
        User actor = currentUser.require();
        ProductOrder request = material(id);
        if (request.getStatus() == ProductOrderStatus.COLLECTED)
            throw error(HttpStatus.CONFLICT, "Cannot cancel after collection");
        if (request.getStatus() == ProductOrderStatus.CANCELLED)
            throw error(HttpStatus.CONFLICT, "Already cancelled");
        ProductOrderStatus prev = request.getStatus();
        if (Set.of(ProductOrderStatus.RESERVED, ProductOrderStatus.PREPARING,
                ProductOrderStatus.READY_FOR_PICKUP, ProductOrderStatus.PLUMBER_AT_STORE).contains(request.getStatus())) {
            releaseReservations(request);
        }
        request.setStatus(ProductOrderStatus.CANCELLED);
        if (reason != null) request.setNotes(reason);
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), prev, ProductOrderStatus.CANCELLED, actor, reason);
        return toDetail(saved);
    }

    @Transactional
    public MaterialRequestDetailResponse adminReassignStore(Long id, Long newStoreId) {
        requireAdmin();
        User actor = currentUser.require();
        ProductOrder request = material(id);
        Store newStore = stores.findById(newStoreId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "New store not found"));
        
        // Release old reservations if they exist
        releaseReservations(request);
        
        // Validate new store stocks all products, and if currently in a reserved state, check and deduct stock
        boolean shouldReserve = Set.of(ProductOrderStatus.RESERVED, ProductOrderStatus.PREPARING,
                ProductOrderStatus.READY_FOR_PICKUP, ProductOrderStatus.PLUMBER_AT_STORE).contains(request.getStatus());
        
        for (ProductOrderItem item : request.getItems()) {
            Stock stock = stocks.findForUpdateByStoreIdAndProductId(newStoreId, item.getProduct().getId())
                    .orElseThrow(() -> error(HttpStatus.BAD_REQUEST, "New store does not stock product " + item.getProduct().getId()));
            
            if (shouldReserve) {
                int quantityToReserve = item.getReservedQuantity() > 0 ? item.getReservedQuantity() : item.getQuantity();
                if (stock.getAvailableQuantity() < quantityToReserve) {
                    throw error(HttpStatus.CONFLICT, "Insufficient stock at new store for product " + item.getProduct().getId());
                }
                // deduct available, increment reserved
                stock.setAvailableQuantity(stock.getAvailableQuantity() - quantityToReserve);
                stock.setReservedQuantity(stock.getReservedQuantity() + quantityToReserve);
                stocks.save(stock);
                
                // save new reservation
                reservations.save(InventoryReservation.builder()
                        .customer(request.getCustomer())
                        .stock(stock)
                        .order(request)
                        .quantity(quantityToReserve)
                        .status(ReservationStatus.CONFIRMED)
                        .expiresAt(LocalDateTime.now().plusDays(7))
                        .build());
            }
        }
        
        // Update request and service order stores
        request.setStore(newStore);
        if (request.getServiceOrder() != null) {
            request.getServiceOrder().setStore(newStore);
            jobs.save(request.getServiceOrder());
        }
        
        ProductOrder saved = requests.save(request);
        recordHistory(saved.getId(), saved.getStatus(), saved.getStatus(), actor, "Reassigned store to: " + newStore.getName());
        return toDetail(saved);
    }

    // ─── MAPPING ─────────────────────────────────────────────────────────────

    public MaterialRequestDetailResponse toDetail(ProductOrder r) {
        List<MaterialRequestItemResponse> items = r.getItems() == null ? List.of() :
                r.getItems().stream().map(i -> new MaterialRequestItemResponse(
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getProduct().getSku(),
                        i.getPrice(),
                        i.getQuantity(),
                        i.getReservedQuantity()
                )).toList();
        return new MaterialRequestDetailResponse(
                r.getId(),
                r.getServiceOrder() == null ? null : r.getServiceOrder().getId(),
                r.getStore().getId(),
                r.getStore().getName(),
                r.getStore().getAddress(),
                r.getRequestedByPlumber() == null ? null : r.getRequestedByPlumber().getId(),
                r.getRequestedByPlumber() == null ? null : r.getRequestedByPlumber().getFullName(),
                r.getCustomer() == null ? null : r.getCustomer().getId(),
                r.getCustomer() == null ? null : r.getCustomer().getFullName(),
                r.getStatus().name(),
                r.getNotes(),
                r.getTotalAmount(),
                items,
                r.getCreatedAt(),
                r.getStoreConfirmedAt(),
                r.getPlumberArrivedAt(),
                r.getPlumberCollectedAt(),
                r.getCollectionConfirmedAt()
        );
    }

    public MaterialRequestSummaryResponse toSummary(ProductOrder r) {
        return new MaterialRequestSummaryResponse(
                r.getId(),
                r.getServiceOrder() == null ? null : r.getServiceOrder().getId(),
                r.getStore().getId(),
                r.getStore().getName(),
                r.getRequestedByPlumber() == null ? null : r.getRequestedByPlumber().getId(),
                r.getRequestedByPlumber() == null ? null : r.getRequestedByPlumber().getFullName(),
                r.getCustomer() == null ? null : r.getCustomer().getId(),
                r.getCustomer() == null ? null : r.getCustomer().getFullName(),
                r.getStatus().name(),
                r.getTotalAmount(),
                r.getCreatedAt(),
                r.getStoreConfirmedAt(),
                r.getPlumberArrivedAt(),
                r.getPlumberCollectedAt(),
                r.getCollectionConfirmedAt()
        );
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private void validate(CartItemDTO input, Set<Long> unique) {
        if (input == null || input.getProductId() == null || input.getQuantity() == null
                || input.getQuantity() <= 0 || input.getQuantity() > 1000)
            throw error(HttpStatus.BAD_REQUEST, "Each quantity must be between 1 and 1000");
        if (!unique.add(input.getProductId())) throw error(HttpStatus.BAD_REQUEST, "Duplicate products are not allowed");
    }

    private User role(Role role) {
        User user = currentUser.require();
        if (user.getRole() != role) throw new AccessDeniedException("Required role: " + role);
        return user;
    }

    private void requireAdmin() {
        User user = currentUser.require();
        if (!admin(user)) throw new AccessDeniedException("Admin access required");
    }

    private ProductOrder plumberRequestEntity(Long id) {
        ProductOrder request = material(id);
        User plumber = role(Role.PLUMBER);
        if (request.getRequestedByPlumber() == null || !Objects.equals(request.getRequestedByPlumber().getId(), plumber.getId()))
            throw new AccessDeniedException("Material request belongs to another plumber");
        return request;
    }

    private ProductOrder storeRequestEntity(Long id) {
        ProductOrder request = material(id);
        User manager = role(Role.STORE_MANAGER);
        if (!Objects.equals(request.getStore().getManager().getId(), manager.getId()))
            throw new AccessDeniedException("Material request belongs to another store");
        return request;
    }

    private ProductOrder material(Long id) {
        return requests.findById(id).filter(r -> r.getServiceOrder() != null)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Material request not found"));
    }

    private ServiceOrder assignedJob(Long id) {
        User plumber = role(Role.PLUMBER);
        ServiceOrder job = jobs.findById(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Service order not found"));
        if (job.getPlumber() == null || !Objects.equals(job.getPlumber().getId(), plumber.getId()))
            throw new AccessDeniedException("Job belongs to another plumber");
        return job;
    }

    private void move(ProductOrder request, ProductOrderStatus from, ProductOrderStatus to) {
        if (request.getStatus() != from)
            throw error(HttpStatus.CONFLICT, "Invalid transition from " + request.getStatus() + " to " + to);
        request.setStatus(to);
    }

    private boolean admin(User user) {
        return Set.of(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATIONS_ADMIN).contains(user.getRole());
    }

    private void recordHistory(Long orderId, ProductOrderStatus prev, ProductOrderStatus next, User actor, String reason) {
        historyRepo.save(ProductOrderStatusHistory.builder()
                .productOrderId(orderId)
                .previousStatus(prev == null ? null : prev.name())
                .newStatus(next.name())
                .actorId(actor == null ? null : actor.getId())
                .actorRole(actor == null ? null : actor.getRole().name())
                .reason(reason)
                .build());
    }

    private ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
}
