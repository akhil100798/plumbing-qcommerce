package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceOrderService {

    private static final BigDecimal PLATFORM_FEE = new BigDecimal("50.00");
    private static final BigDecimal HOURLY_LABOR_RATE = new BigDecimal("300.00");

    private final ServiceOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OutboxEventRepository outboxRepository;
    private final CurrentUser currentUser;
    private final ProductOrderRepository productOrderRepository;

    private void saveToOutbox(String aggregateId, String type, String topic, String payload) {
        OutboxEvent event = OutboxEvent.builder()
                .aggregateId(aggregateId)
                .aggregateType("SERVICE_ORDER")
                .eventType(type)
                .topic(topic)
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(event);
    }

    /**
     * Customer creates a new service request (any of the 3 workflows)
     */
    @Transactional
    public ServiceOrder createOrder(Long customerId, String description,
                                    Double latitude, Double longitude,
                                    RequestType requestType) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || !actor.getId().equals(customerId)) {
            throw new AccessDeniedException("Customers may create only their own orders");
        }
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        ServiceOrder order = ServiceOrder.builder()
                .customer(customer)
                .description(description)
                .customerLatitude(latitude)
                .customerLongitude(longitude)
                .requestType(requestType)
                .status(OrderStatus.PENDING)
                .build();

        ServiceOrder saved = orderRepository.save(order);

        // Save to Outbox instead of direct Kafka call
        saveToOutbox(String.valueOf(saved.getId()), "ORDER_CREATED", "order-created",
                "ORDER_CREATED:" + saved.getId() + ":CUSTOMER:" + customerId);
        
        log.info("Order #{} persisted in outbox for synchronization.", saved.getId());

        return saved;
    }

    /**
     * Store Manager or Plumber accepts the job
     */
    @Transactional
    public ServiceOrder acceptOrder(Long orderId, Long plumberId) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.PLUMBER || !actor.getId().equals(plumberId)) {
            throw new AccessDeniedException("Plumbers may accept orders only as themselves");
        }
        ServiceOrder order = getOrderOrThrow(orderId);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Order #" + orderId + " cannot be accepted. Status: " + order.getStatus());
        }

        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new RuntimeException("Plumber not found: " + plumberId));
        if (plumber.getRole() != Role.PLUMBER) {
            throw new IllegalArgumentException("Assigned user is not a plumber");
        }

        order.setPlumber(plumber);
        order.setStatus(OrderStatus.ACCEPTED);
        order.setAcceptedAt(LocalDateTime.now());

        ServiceOrder saved = orderRepository.save(order);

        // Save to Outbox
        saveToOutbox(String.valueOf(orderId), "ORDER_ACCEPTED", "order-accepted",
                "ORDER_ACCEPTED:" + orderId + ":PLUMBER:" + plumberId + ":CUSTOMER:" + order.getCustomer().getId());

        log.info("Order #{} acceptance persisted in outbox.", orderId);

        return saved;
    }

    /**
     * Plumber is on-site, work has started
     */
    @Transactional
    public ServiceOrder startOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        requireAssignedPlumber(order);

        if (order.getStatus() != OrderStatus.ACCEPTED) {
            throw new IllegalArgumentException("Order cannot be started from status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setStartedAt(LocalDateTime.now());
        log.info("Order #{} is now IN_PROGRESS", orderId);

        return orderRepository.save(order);
    }

    /**
     * Plumber completes the job — triggers the Billing Engine.
     *
     * Phase 3 enhancement: partsCharge is now computed automatically by summing
     * the totalAmount of all DELIVERED ProductOrders linked to this ServiceOrder.
     * A 10% referral commission on parts is also recorded for the plumber.
     *
     * @param orderId     The service job to complete.
     * @param extraCharge Optional manual parts charge (e.g. cash purchases not in system).
     */
    @Transactional
    public ServiceOrder completeOrder(Long orderId, BigDecimal extraCharge) {
        ServiceOrder order = getOrderOrThrow(orderId);
        requireAssignedPlumber(order);

        if (order.getStatus() != OrderStatus.IN_PROGRESS
                && order.getStatus() != OrderStatus.COMBINED_ORDER) {
            throw new IllegalArgumentException("Order cannot be completed from status: " + order.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        order.setCompletedAt(now);
        order.setStatus(OrderStatus.COMPLETED);

        // ---- BILLING ENGINE ----
        // 1. Labour cost
        long minutesWorked = ChronoUnit.MINUTES.between(order.getStartedAt(), now);
        double hoursWorked = Math.max(0.5, minutesWorked / 60.0);
        BigDecimal labor = HOURLY_LABOR_RATE.multiply(BigDecimal.valueOf(hoursWorked));

        // 2. Parts cost — auto-aggregate from all DELIVERED material product orders
        BigDecimal deliveredPartsTotal = productOrderRepository
                .findByServiceOrderIdAndStatus(orderId, ProductOrderStatus.DELIVERED)
                .stream()
                .map(po -> po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Add any extra cash-based charges passed by the plumber
        BigDecimal totalPartsCharge = deliveredPartsTotal
                .add(extraCharge != null ? extraCharge : BigDecimal.ZERO);

        // 3. Referral commission — 10% of parts ordered through the platform
        BigDecimal referralCommission = deliveredPartsTotal
                .multiply(new BigDecimal("0.10"))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        order.setLaborCharge(labor.setScale(2, java.math.RoundingMode.HALF_UP));
        order.setPartsCharge(totalPartsCharge.setScale(2, java.math.RoundingMode.HALF_UP));
        order.setReferralCommission(referralCommission);
        order.setPlatformFee(PLATFORM_FEE);
        order.setTotalAmount(
                order.getLaborCharge()
                        .add(order.getPartsCharge())
                        .add(PLATFORM_FEE));

        ServiceOrder saved = orderRepository.save(order);

        // Publish completion event for inventory reconcile
        saveToOutbox(String.valueOf(orderId), "ORDER_COMPLETED", "order-completed",
                "ORDER_COMPLETED:" + orderId + ":AMOUNT:" + saved.getTotalAmount()
                + ":COMMISSION:" + referralCommission);

        log.info("Order #{} completed. Labour=₹{}, Parts=₹{}, Commission=₹{}, Total=₹{}",
                orderId, saved.getLaborCharge(), saved.getPartsCharge(),
                referralCommission, saved.getTotalAmount());

        return saved;
    }

    public ServiceOrder cancelOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        boolean allowed = actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.CUSTOMER
                && order.getCustomer().getId().equals(actor.getId());
        if (!allowed) {
            throw new AccessDeniedException("Only the owning customer or an administrator may cancel this order");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot cancel a completed order.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    public List<ServiceOrder> getOrdersByCustomer(Long customerId) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.ADMIN && !actor.getId().equals(customerId)) {
            throw new AccessDeniedException("Customers may view only their own orders");
        }
        return orderRepository.findByCustomer_Id(customerId);
    }

    public List<ServiceOrder> getOrdersByStatus(OrderStatus status) {
        Role role = currentUser.require().getRole();
        if (role != Role.ADMIN && role != Role.PLUMBER && role != Role.STORE_MANAGER) {
            throw new AccessDeniedException("This role cannot browse orders by status");
        }
        return orderRepository.findByStatus(status);
    }

    public ServiceOrder getOrderById(Long id) {
        ServiceOrder order = getOrderOrThrow(id);
        User actor = currentUser.require();
        boolean allowed = actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.CUSTOMER && order.getCustomer().getId().equals(actor.getId())
                || actor.getRole() == Role.PLUMBER && order.getPlumber() != null
                    && order.getPlumber().getId().equals(actor.getId())
                || actor.getRole() == Role.STORE_MANAGER && order.getStore() != null
                    && order.getStore().getManager().getId().equals(actor.getId());
        if (!allowed) {
            throw new AccessDeniedException("This order is not accessible to the current user");
        }
        return order;
    }

    private void requireAssignedPlumber(ServiceOrder order) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.PLUMBER || order.getPlumber() == null
                || !order.getPlumber().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the assigned plumber may update this order");
        }
    }

    private ServiceOrder getOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service order not found: " + id));
    }
}
