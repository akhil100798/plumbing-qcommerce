package com.pqc.core.service;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
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
    private final CurrentUser currentUser;

    @Transactional
    public ProductOrder createMaterialRequest(Long jobId, Long storeId, List<CartItemDTO> inputs) {
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
        job.setStore(store); job.setStatus(OrderStatus.MATERIALS_REQUIRED); jobs.save(job);
        return saved;
    }

    @Transactional
    public ProductOrder submit(Long id) {
        ProductOrder request = plumberRequest(id);
        move(request, ProductOrderStatus.REQUESTED, ProductOrderStatus.STORE_REVIEWING);
        request.getServiceOrder().setStatus(OrderStatus.WAITING_FOR_STORE);
        jobs.save(request.getServiceOrder());
        return requests.save(request);
    }

    @Transactional(readOnly = true)
    public List<ProductOrder> plumberRequests() {
        return requests.findByServiceOrder_Plumber_Id(role(Role.PLUMBER).getId());
    }

    @Transactional(readOnly = true)
    public List<ProductOrder> storeRequests() {
        return requests.findByStore_Manager_IdAndServiceOrderIsNotNull(role(Role.STORE_MANAGER).getId());
    }

    @Transactional(readOnly = true)
    public List<ProductOrder> serviceOrderRequests(Long jobId) {
        User actor = currentUser.require();
        ServiceOrder job = jobs.findById(jobId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Service order not found"));
        boolean allowed = admin(actor) || Objects.equals(job.getCustomer().getId(), actor.getId())
                || job.getPlumber() != null && Objects.equals(job.getPlumber().getId(), actor.getId());
        if (!allowed) throw new AccessDeniedException("Service order belongs to another user");
        return requests.findByServiceOrderId(jobId);
    }

    @Transactional
    public ProductOrder approve(Long id, Map<Long,Integer> quantities) {
        ProductOrder request = storeRequest(id);
        if (request.getStatus() != ProductOrderStatus.STORE_REVIEWING) throw error(HttpStatus.CONFLICT, "Request is not awaiting review");
        boolean partial = false;
        for (ProductOrderItem item : request.getItems()) {
            int quantity = quantities == null ? item.getQuantity() : quantities.getOrDefault(item.getProduct().getId(), 0);
            if (quantity < 0 || quantity > item.getQuantity()) throw error(HttpStatus.BAD_REQUEST, "Invalid approved quantity");
            item.setReservedQuantity(quantity); partial |= quantity < item.getQuantity();
        }
        if (request.getItems().stream().allMatch(i -> i.getReservedQuantity() == 0)) throw error(HttpStatus.BAD_REQUEST, "Approve at least one item");
        request.setStatus(partial ? ProductOrderStatus.PARTIALLY_AVAILABLE : ProductOrderStatus.APPROVED);
        request.setStoreConfirmedAt(LocalDateTime.now());
        return requests.save(request);
    }

    @Transactional
    public ProductOrder reject(Long id, String reason) {
        ProductOrder request = storeRequest(id);
        move(request, ProductOrderStatus.STORE_REVIEWING, ProductOrderStatus.REJECTED);
        request.setNotes(reason); return requests.save(request);
    }

    @Transactional
    public ProductOrder reserve(Long id) {
        ProductOrder request = storeRequest(id);
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
            reservations.save(InventoryReservation.builder().customer(request.getCustomer()).stock(stock).order(request)
                    .quantity(quantity).status(ReservationStatus.CONFIRMED).expiresAt(LocalDateTime.now().plusDays(7)).build());
        }
        request.setStatus(ProductOrderStatus.RESERVED);
        return requests.save(request);
    }

    @Transactional
    public ProductOrder prepare(Long id) {
        ProductOrder request = storeRequest(id); move(request, ProductOrderStatus.RESERVED, ProductOrderStatus.PREPARING);
        return requests.save(request);
    }

    @Transactional
    public ProductOrder ready(Long id) {
        ProductOrder request = storeRequest(id); move(request, ProductOrderStatus.PREPARING, ProductOrderStatus.READY_FOR_PICKUP);
        request.getServiceOrder().setStatus(OrderStatus.READY_FOR_PRODUCT_PICKUP);
        jobs.save(request.getServiceOrder()); return requests.save(request);
    }

    @Transactional
    public ProductOrder arrived(Long id) {
        ProductOrder request = plumberRequest(id); move(request, ProductOrderStatus.READY_FOR_PICKUP, ProductOrderStatus.PLUMBER_AT_STORE);
        request.setPlumberArrivedAt(LocalDateTime.now());
        request.getServiceOrder().setStatus(OrderStatus.PLUMBER_COLLECTING_PRODUCTS);
        jobs.save(request.getServiceOrder()); return requests.save(request);
    }

    @Transactional
    public ProductOrder collect(Long id) {
        ProductOrder request = plumberRequest(id);
        if (request.getStatus() != ProductOrderStatus.PLUMBER_AT_STORE || request.getPlumberCollectedAt() != null)
            throw error(HttpStatus.CONFLICT, "Collection is not allowed or was already recorded");
        request.setPlumberCollectedAt(LocalDateTime.now()); request.setCollectedByPlumber(currentUser.require());
        return requests.save(request);
    }

    @Transactional
    public ProductOrder confirmCollection(Long id) {
        ProductOrder request = storeRequest(id);
        if (request.getStatus() != ProductOrderStatus.PLUMBER_AT_STORE || request.getPlumberCollectedAt() == null)
            throw error(HttpStatus.CONFLICT, "Assigned plumber must record collection first");
        for (InventoryReservation reservation : reservations.findByOrderId(id)) {
            if (reservation.getStatus() != ReservationStatus.CONFIRMED) throw error(HttpStatus.CONFLICT, "Collection already finalized");
            Stock stock = stocks.findForUpdateByStoreIdAndProductId(request.getStore().getId(), reservation.getStock().getProduct().getId()).orElseThrow();
            if (stock.getReservedQuantity() < reservation.getQuantity()) throw error(HttpStatus.CONFLICT, "Reserved stock is inconsistent");
            stock.setReservedQuantity(stock.getReservedQuantity() - reservation.getQuantity());
            stocks.save(stock); reservation.setStatus(ReservationStatus.COMPLETED); reservations.save(reservation);
        }
        request.setStatus(ProductOrderStatus.COLLECTED); request.setCollectionConfirmedAt(LocalDateTime.now());
        request.getServiceOrder().setStatus(OrderStatus.PRODUCTS_COLLECTED); jobs.save(request.getServiceOrder());
        return requests.save(request);
    }

    @Transactional
    public ServiceOrder returning(Long jobId) {
        ServiceOrder job = assignedJob(jobId);
        if (job.getStatus() != OrderStatus.PRODUCTS_COLLECTED) throw error(HttpStatus.CONFLICT, "Products must be collected first");
        job.setStatus(OrderStatus.RETURNING_TO_CUSTOMER); return jobs.save(job);
    }

    @Transactional
    public ServiceOrder resume(Long jobId) {
        ServiceOrder job = assignedJob(jobId);
        if (job.getStatus() != OrderStatus.RETURNING_TO_CUSTOMER) throw error(HttpStatus.CONFLICT, "Plumber must be returning to customer");
        job.setStatus(OrderStatus.WORK_RESUMED); return jobs.save(job);
    }

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
    private ProductOrder plumberRequest(Long id) {
        ProductOrder request = material(id); User plumber = role(Role.PLUMBER);
        if (request.getRequestedByPlumber() == null || !Objects.equals(request.getRequestedByPlumber().getId(), plumber.getId()))
            throw new AccessDeniedException("Material request belongs to another plumber");
        return request;
    }
    private ProductOrder storeRequest(Long id) {
        ProductOrder request = material(id); User manager = role(Role.STORE_MANAGER);
        if (!Objects.equals(request.getStore().getManager().getId(), manager.getId()))
            throw new AccessDeniedException("Material request belongs to another store");
        return request;
    }
    private ProductOrder material(Long id) { return requests.findById(id).filter(r -> r.getServiceOrder() != null).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Material request not found")); }
    private ServiceOrder assignedJob(Long id) {
        User plumber = role(Role.PLUMBER); ServiceOrder job = jobs.findById(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Service order not found"));
        if (job.getPlumber() == null || !Objects.equals(job.getPlumber().getId(), plumber.getId())) throw new AccessDeniedException("Job belongs to another plumber");
        return job;
    }
    private void move(ProductOrder request, ProductOrderStatus from, ProductOrderStatus to) {
        if (request.getStatus() != from) throw error(HttpStatus.CONFLICT, "Invalid transition from " + request.getStatus() + " to " + to);
        request.setStatus(to);
    }
    private boolean admin(User user) { return Set.of(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATIONS_ADMIN).contains(user.getRole()); }
    private ResponseStatusException error(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
