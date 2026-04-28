package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        ServiceOrder order = getOrderOrThrow(orderId);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Order #" + orderId + " cannot be accepted. Status: " + order.getStatus());
        }

        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new RuntimeException("Plumber not found: " + plumberId));

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

        if (order.getStatus() != OrderStatus.ACCEPTED) {
            throw new IllegalArgumentException("Order cannot be started from status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setStartedAt(LocalDateTime.now());
        log.info("Order #{} is now IN_PROGRESS", orderId);

        return orderRepository.save(order);
    }

    /**
     * Plumber completes the job — triggers the Billing Engine
     */
    @Transactional
    public ServiceOrder completeOrder(Long orderId, BigDecimal partsCharge) {
        ServiceOrder order = getOrderOrThrow(orderId);

        if (order.getStatus() != OrderStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Order cannot be completed from status: " + order.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        order.setCompletedAt(now);
        order.setStatus(OrderStatus.COMPLETED);

        // ---- BILLING ENGINE ----
        // Calculate hours worked
        long minutesWorked = ChronoUnit.MINUTES.between(order.getStartedAt(), now);
        double hoursWorked = Math.max(0.5, minutesWorked / 60.0); // Minimum 30 min billing
        BigDecimal labor = HOURLY_LABOR_RATE.multiply(BigDecimal.valueOf(hoursWorked));

        order.setLaborCharge(labor.setScale(2, java.math.RoundingMode.HALF_UP));
        order.setPartsCharge(partsCharge != null ? partsCharge : BigDecimal.ZERO);
        order.setPlatformFee(PLATFORM_FEE);
        order.setTotalAmount(order.getLaborCharge().add(order.getPartsCharge()).add(PLATFORM_FEE));

        ServiceOrder saved = orderRepository.save(order);

        // Save to Outbox for inventory reconcile
        saveToOutbox(String.valueOf(orderId), "ORDER_COMPLETED", "order-completed",
                "ORDER_COMPLETED:" + orderId + ":AMOUNT:" + saved.getTotalAmount());
        
        log.info("Order #{} completion billing persisted in outbox.", orderId);

        return saved;
    }

    public ServiceOrder cancelOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot cancel a completed order.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    public List<ServiceOrder> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomer_Id(customerId);
    }

    public List<ServiceOrder> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    public ServiceOrder getOrderById(Long id) {
        return getOrderOrThrow(id);
    }

    private ServiceOrder getOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service order not found: " + id));
    }
}
