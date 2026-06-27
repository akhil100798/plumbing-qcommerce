package com.pqc.core.service;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final StockRepository stockRepository;
    private final InventoryReservationRepository reservationRepository;
    private final ProductOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final OutboxEventRepository outboxRepository;
    private final ServiceOrderRepository serviceOrderRepository;

    /**
     * Reserve Stock - Phase 1 Inventory reservation logic
     */
    @Transactional
    public ProductOrder reserveStock(Long customerId, Long storeId, List<CartItemDTO> cartItems) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || !actor.getId().equals(customerId)) {
            if (actor.getRole() == Role.PLUMBER) {
                boolean hasActiveJob = serviceOrderRepository.existsByCustomer_IdAndPlumber_IdAndStatusIn(
                        customerId, actor.getId(), List.of(OrderStatus.IN_PROGRESS, OrderStatus.COMBINED_ORDER));
                if (!hasActiveJob) {
                    throw new AccessDeniedException("Assigned plumbers can only request materials for their active jobs");
                }
            } else {
                throw new AccessDeniedException("Customers can only checkout for themselves");
            }
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found: " + storeId));

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<ProductOrderItem> orderItems = new ArrayList<>();
        List<Stock> stocksToSave = new ArrayList<>();
        List<InventoryReservation> reservationsToSave = new ArrayList<>();

        ProductOrder order = ProductOrder.builder()
                .customer(customer)
                .store(store)
                .status(ProductOrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO) // temporary
                .build();

        for (CartItemDTO item : cartItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));

            Stock stock = stockRepository.findByStoreIdAndProductId(storeId, item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product " + product.getName() + " is not available at store " + store.getName()));

            if (stock.getAvailableQuantity() < item.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for product " + product.getName() + 
                        ". Available: " + stock.getAvailableQuantity() + ", Requested: " + item.getQuantity());
            }

            // Reserve stock
            stock.setAvailableQuantity(stock.getAvailableQuantity() - item.getQuantity());
            stock.setReservedQuantity(stock.getReservedQuantity() + item.getQuantity());
            stocksToSave.add(stock);

            // Calculate item price
            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            ProductOrderItem orderItem = ProductOrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.getQuantity())
                    .price(product.getPrice())
                    .build();
            orderItems.add(orderItem);

            // Create inventory reservation
            InventoryReservation reservation = InventoryReservation.builder()
                    .customer(customer)
                    .stock(stock)
                    .quantity(item.getQuantity())
                    .status(ReservationStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusMinutes(10)) // 10 minutes limit
                    .order(order)
                    .build();
            reservationsToSave.add(reservation);
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        // Save everything
        ProductOrder savedOrder = orderRepository.save(order);
        stockRepository.saveAll(stocksToSave);
        reservationRepository.saveAll(reservationsToSave);

        log.info("Reserved stock for order #{} total amount: {}", savedOrder.getId(), totalAmount);
        return savedOrder;
    }

    /**
     * Confirm Payment & finalize inventory count.
     *
     * Phase 3 enhancement: if this ProductOrder is linked to a ServiceOrder
     * (i.e. it was a mid-job material request), we:
     *   1. Transition the ServiceOrder back to IN_PROGRESS (parts are coming).
     *   2. Emit a MATERIAL_ORDER_CONFIRMED OutboxEvent → Edge Service dispatches
     *      a delivery partner to pick up and deliver the parts to the job site.
     */
    @Transactional
    public void confirmPayment(Long orderId) {
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getStatus() != ProductOrderStatus.PENDING) {
            throw new IllegalStateException("Order #" + orderId + " is not pending payment.");
        }

        order.setStatus(ProductOrderStatus.CONFIRMED);
        orderRepository.save(order);

        List<InventoryReservation> reservations = reservationRepository.findByOrderId(orderId);
        List<Stock> stocksToSave = new ArrayList<>();

        for (InventoryReservation res : reservations) {
            if (res.getStatus() == ReservationStatus.PENDING) {
                res.setStatus(ReservationStatus.CONFIRMED);
                Stock stock = res.getStock();
                stock.setReservedQuantity(stock.getReservedQuantity() - res.getQuantity());
                stocksToSave.add(stock);
            }
        }

        reservationRepository.saveAll(reservations);
        stockRepository.saveAll(stocksToSave);

        // ---- Phase 3: Combined Order handling ----
        Optional<ServiceOrder> linkedServiceOrder = Optional.ofNullable(order.getServiceOrder());
        String eventType = "ORDER_CONFIRMED";
        String topic = "order-confirmed";

        if (linkedServiceOrder.isPresent()) {
            ServiceOrder serviceOrder = linkedServiceOrder.get();
            // Parts paid — restore service order to IN_PROGRESS; delivery is in flight
            serviceOrder.setStatus(OrderStatus.IN_PROGRESS);
            serviceOrderRepository.save(serviceOrder);
            eventType = "MATERIAL_ORDER_CONFIRMED";
            topic = "material-order-confirmed";
            log.info("Material order #{} paid. ServiceOrder #{} reverted to IN_PROGRESS.",
                    orderId, serviceOrder.getId());
        }

        // Build Outbox payload for delivery dispatch
        String payload = "{" +
                "\"orderId\":" + order.getId() + "," +
                "\"storeId\":" + order.getStore().getId() + "," +
                "\"storeLatitude\":" + order.getStore().getLatitude() + "," +
                "\"storeLongitude\":" + order.getStore().getLongitude() + "," +
                "\"customerId\":" + order.getCustomer().getId() +
                (linkedServiceOrder.isPresent()
                        ? ",\"serviceOrderId\":" + linkedServiceOrder.get().getId()
                        : "") +
                "}";

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .aggregateId(String.valueOf(order.getId()))
                .aggregateType("PRODUCT_ORDER")
                .eventType(eventType)
                .topic(topic)
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(outboxEvent);

        log.info("Payment confirmed for order #{}. Outbox event '{}' published.", orderId, eventType);
    }

    /**
     * Release reservations back to inventory on failure/timeout
     */
    @Transactional
    public void releaseReservation(Long orderId) {
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getStatus() != ProductOrderStatus.PENDING) {
            throw new IllegalStateException("Cannot release stock for non-pending order: " + orderId);
        }

        order.setStatus(ProductOrderStatus.CANCELLED);
        orderRepository.save(order);

        List<InventoryReservation> reservations = reservationRepository.findByOrderId(orderId);
        List<Stock> stocksToSave = new ArrayList<>();

        for (InventoryReservation res : reservations) {
            if (res.getStatus() == ReservationStatus.PENDING) {
                res.setStatus(ReservationStatus.RELEASED);
                Stock stock = res.getStock();
                stock.setAvailableQuantity(stock.getAvailableQuantity() + res.getQuantity());
                stock.setReservedQuantity(stock.getReservedQuantity() - res.getQuantity());
                stocksToSave.add(stock);
            }
        }

        reservationRepository.saveAll(reservations);
        stockRepository.saveAll(stocksToSave);
        log.info("Released stock reservations for cancelled order #{}", orderId);
    }

    /**
     * Confirm delivery of order using OTP
     */
    @Transactional
    public ProductOrder confirmDelivery(Long orderId, String otp) {
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getStatus() != ProductOrderStatus.OUT_FOR_DELIVERY) {
            throw new IllegalStateException("Order #" + orderId + " is not out for delivery.");
        }

        if (order.getDeliveryOtp() == null || !order.getDeliveryOtp().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP provided for order #" + orderId);
        }

        order.setStatus(ProductOrderStatus.DELIVERED);
        ProductOrder saved = orderRepository.save(order);

        // Save to Outbox
        String payload = "{" +
                "\"orderId\":" + order.getId() + "," +
                "\"status\":\"DELIVERED\"" +
                "}";

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .aggregateId(String.valueOf(order.getId()))
                .aggregateType("PRODUCT_ORDER")
                .eventType("ORDER_DELIVERED")
                .topic("order-delivered")
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(outboxEvent);

        log.info("Delivery confirmed for order #{}", orderId);
        return saved;
    }

    private void validateOrderStoreAndManager(ProductOrder order, Long requestedStoreId) {
        if (order.getStore() == null || !order.getStore().getId().equals(requestedStoreId)) {
            throw new IllegalArgumentException("Order #" + order.getId() + " does not belong to store #" + requestedStoreId);
        }

        User user = currentUser.require();
        if (user.getRole() != Role.ADMIN) {
            if (user.getRole() != Role.STORE_MANAGER || order.getStore().getManager() == null 
                    || !order.getStore().getManager().getId().equals(user.getId())) {
                throw new AccessDeniedException("You do not have permission to manage orders for this store.");
            }
        }
    }

    public com.pqc.core.dto.OrderDetailResponse mapToResponse(ProductOrder order) {
        List<com.pqc.core.dto.OrderDetailResponse.OrderItemDetail> items = order.getItems().stream()
                .map(item -> com.pqc.core.dto.OrderDetailResponse.OrderItemDetail.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName() : "Unknown")
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .toList();

        com.pqc.core.dto.OrderDetailResponse.OrderDetailResponseBuilder builder = com.pqc.core.dto.OrderDetailResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomer().getId())
                .storeId(order.getStore().getId())
                .storeName(order.getStore().getName())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .deliveryPartnerName(order.getDeliveryPartner() != null ? order.getDeliveryPartner().getFullName() : null)
                .deliveryPartnerPhone(order.getDeliveryPartner() != null ? order.getDeliveryPartner().getPhone() : null)
                .deliveryOtp(order.getDeliveryOtp())
                .estimatedDeliveryAt(order.getEstimatedDeliveryAt())
                .createdAt(order.getCreatedAt())
                .items(items);

        if (order.getServiceOrder() != null) {
            ServiceOrder so = order.getServiceOrder();
            builder.serviceOrderId(so.getId())
                    .serviceOrderStatus(so.getStatus().name())
                    .assignedPlumberName(so.getPlumber() != null ? so.getPlumber().getFullName() : null)
                    .assignedPlumberPhone(so.getPlumber() != null ? so.getPlumber().getPhone() : null);
        }

        return builder.build();
    }

    @Transactional
    public com.pqc.core.dto.OrderDetailResponse acceptOrder(Long id, com.pqc.core.dto.OrderActionRequest request) {
        ProductOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));

        validateOrderStoreAndManager(order, request.getStoreId());

        if (order.getStatus() != ProductOrderStatus.CONFIRMED) {
            throw new IllegalArgumentException("Cannot accept order in status: " + order.getStatus() + ". Must be CONFIRMED.");
        }

        order.setStatus(ProductOrderStatus.PACKING);
        ProductOrder saved = orderRepository.save(order);
        log.info("Order #{} accepted and status updated to PACKING.", id);
        return mapToResponse(saved);
    }

    @Transactional
    public com.pqc.core.dto.OrderDetailResponse packOrder(Long id, com.pqc.core.dto.PackOrderRequest request) {
        ProductOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));

        validateOrderStoreAndManager(order, request.getStoreId());

        if (order.getStatus() != ProductOrderStatus.PACKING) {
            throw new IllegalArgumentException("Cannot pack order in status: " + order.getStatus() + ". Must be PACKING.");
        }

        order.setStatus(ProductOrderStatus.READY_FOR_PICKUP);
        ProductOrder saved = orderRepository.save(order);
        log.info("Order #{} packed and status updated to READY_FOR_PICKUP.", id);
        return mapToResponse(saved);
    }

    @Transactional
    public com.pqc.core.dto.OrderDetailResponse handoverOrder(Long id, com.pqc.core.dto.HandoverRequest request) {
        ProductOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));

        validateOrderStoreAndManager(order, request.getStoreId());

        if (order.getStatus() != ProductOrderStatus.READY_FOR_PICKUP) {
            throw new IllegalArgumentException("Cannot handover order in status: " + order.getStatus() + ". Must be READY_FOR_PICKUP.");
        }

        if (request.getDeliveryPartnerId() != null) {
            User partner = userRepository.findById(request.getDeliveryPartnerId())
                    .orElseThrow(() -> new RuntimeException("Delivery partner not found: " + request.getDeliveryPartnerId()));
            if (partner.getRole() != Role.DELIVERY_PARTNER) {
                throw new IllegalArgumentException("User " + request.getDeliveryPartnerId() + " is not a delivery partner.");
            }
            order.setDeliveryPartner(partner);
        }

        String otp = request.getOtp();
        if (otp == null || otp.trim().isEmpty()) {
            if (order.getDeliveryOtp() == null) {
                otp = String.format("%04d", new java.util.Random().nextInt(10000));
                order.setDeliveryOtp(otp);
            }
        } else {
            order.setDeliveryOtp(otp);
        }

        if (order.getEstimatedDeliveryAt() == null) {
            order.setEstimatedDeliveryAt(LocalDateTime.now().plusMinutes(30));
        }

        order.setStatus(ProductOrderStatus.OUT_FOR_DELIVERY);
        ProductOrder saved = orderRepository.save(order);

        String payload = "{" +
                "\"orderId\":" + saved.getId() + "," +
                "\"deliveryPartnerId\":" + (saved.getDeliveryPartner() != null ? saved.getDeliveryPartner().getId() : null) + "," +
                "\"deliveryPartnerName\":\"" + (saved.getDeliveryPartner() != null ? saved.getDeliveryPartner().getFullName() : "") + "\"," +
                "\"deliveryOtp\":\"" + saved.getDeliveryOtp() + "\"," +
                "\"customerId\":" + saved.getCustomer().getId() +
                "}";

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .aggregateId(String.valueOf(saved.getId()))
                .aggregateType("PRODUCT_ORDER")
                .eventType("DELIVERY_ASSIGNED")
                .topic("delivery-assigned")
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(outboxEvent);

        log.info("Order #{} handed over to rider. Status updated to OUT_FOR_DELIVERY.", id);
        return mapToResponse(saved);
    }
}
