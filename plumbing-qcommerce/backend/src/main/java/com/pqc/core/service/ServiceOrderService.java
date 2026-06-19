package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            throw new OrderConflictException(
                    "ORDER_ALREADY_ACCEPTED",
                    "Order #" + orderId + " has already been accepted or is no longer pending.");
        }

        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new RuntimeException("Plumber not found: " + plumberId));
        if (plumber.getRole() != Role.PLUMBER) {
            throw new IllegalArgumentException("Assigned user is not a plumber");
        }

        order.setPlumber(plumber);
        transition(order, OrderStatus.PENDING, OrderStatus.ACCEPTED);
        order.setAcceptedAt(LocalDateTime.now());

        ServiceOrder saved = saveOrderTransition(order, "ORDER_ALREADY_ACCEPTED",
                "Order #" + orderId + " was accepted by another plumber.");

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

        transition(order, OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS);
        order.setStartedAt(LocalDateTime.now());
        log.info("Order #{} is now IN_PROGRESS", orderId);

        ServiceOrder saved = orderRepository.saveAndFlush(order);
        saveToOutbox(String.valueOf(orderId), "ORDER_STARTED", "order-started",
                "ORDER_STARTED:" + orderId);
        return saved;
    }

    /**
     * Plumber completes the job — triggers the Billing Engine
     */
    @Transactional
    public ServiceOrder completeOrder(Long orderId, BigDecimal partsCharge) {
        ServiceOrder order = getOrderOrThrow(orderId);
        requireAssignedPlumber(order);

        if (partsCharge != null && partsCharge.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalOrderTransitionException(
                    "VALIDATION_FAILED",
                    "Parts charge must be greater than or equal to 0.00");
        }

        LocalDateTime now = LocalDateTime.now();
        order.setCompletedAt(now);
        transition(order, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED);

        // ---- BILLING ENGINE ----
        // Calculate hours worked
        long minutesWorked = ChronoUnit.MINUTES.between(order.getStartedAt(), now);
        double hoursWorked = Math.max(0.5, minutesWorked / 60.0); // Minimum 30 min billing
        BigDecimal labor = HOURLY_LABOR_RATE.multiply(BigDecimal.valueOf(hoursWorked));

        order.setLaborCharge(labor.setScale(2, java.math.RoundingMode.HALF_UP));
        order.setPartsCharge(partsCharge != null ? partsCharge : BigDecimal.ZERO);
        order.setPlatformFee(PLATFORM_FEE);
        order.setTotalAmount(order.getLaborCharge().add(order.getPartsCharge()).add(PLATFORM_FEE));

        ServiceOrder saved = orderRepository.saveAndFlush(order);

        // Save to Outbox for inventory reconcile
        saveToOutbox(String.valueOf(orderId), "ORDER_COMPLETED", "order-completed",
                "ORDER_COMPLETED:" + orderId + ":AMOUNT:" + saved.getTotalAmount());
        
        log.info("Order #{} completion billing persisted in outbox.", orderId);

        return saved;
    }

    @Transactional
    public ServiceOrder cancelOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        boolean allowed = actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.CUSTOMER
                && order.getCustomer().getId().equals(actor.getId());
        if (!allowed) {
            throw new AccessDeniedException("Only the owning customer or an administrator may cancel this order");
        }
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.ACCEPTED) {
            throw new IllegalOrderTransitionException(
                    "ILLEGAL_ORDER_TRANSITION",
                    "Order cannot be cancelled from status: " + order.getStatus());
        }
        OrderStatus previous = order.getStatus();
        transition(order, previous, OrderStatus.CANCELLED);
        ServiceOrder saved = orderRepository.saveAndFlush(order);
        saveToOutbox(String.valueOf(orderId), "ORDER_CANCELLED", "order-cancelled",
                "ORDER_CANCELLED:" + orderId);
        return saved;
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

    private void transition(ServiceOrder order, OrderStatus expected, OrderStatus next) {
        if (order.getStatus() != expected) {
            throw new IllegalOrderTransitionException(
                    "ILLEGAL_ORDER_TRANSITION",
                    "Order cannot transition from " + order.getStatus() + " to " + next);
        }
        order.setStatus(next);
    }

    private ServiceOrder saveOrderTransition(ServiceOrder order, String code, String message) {
        try {
            return orderRepository.saveAndFlush(order);
        } catch (OptimisticLockingFailureException ex) {
            throw new OrderConflictException(code, message);
        }
    }

    private ServiceOrder getOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service order not found: " + id));
    }
}
