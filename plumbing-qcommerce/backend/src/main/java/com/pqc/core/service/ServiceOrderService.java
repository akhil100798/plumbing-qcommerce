package com.pqc.core.service;

import com.pqc.core.dto.CustomerConfirmationResponse;
import com.pqc.core.dto.RatingRequest;
import com.pqc.core.dto.RatingResponse;
import com.pqc.core.dto.ServiceOrderStatusHistoryResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.repository.ServiceOrderStatusHistoryRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

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
    private final ServiceOrderStatusHistoryRepository historyRepository;

    private void recordHistory(Long orderId, OrderStatus prev, OrderStatus next, User actor, String reason) {
        historyRepository.save(ServiceOrderStatusHistory.builder()
                .serviceOrderId(orderId)
                .previousStatus(prev != null ? prev.name() : null)
                .newStatus(next.name())
                .actorId(actor != null ? actor.getId() : null)
                .actorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : null)
                .reason(reason)
                .build());
    }

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
                .orElseThrow(() -> notFound("Customer not found: " + customerId));

        ServiceOrder order = ServiceOrder.builder()
                .customer(customer)
                .description(description)
                .customerLatitude(latitude)
                .customerLongitude(longitude)
                .requestType(requestType)
                .status(OrderStatus.PENDING)
                .build();

        ServiceOrder saved = orderRepository.save(order);
        recordHistory(saved.getId(), null, OrderStatus.PENDING, actor, "Order created");

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

        if (order.getStatus() == OrderStatus.ACCEPTED
                && order.getPlumber() != null
                && order.getPlumber().getId().equals(plumberId)) {
            return order;
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw conflict("Order #" + orderId + " cannot be accepted. Status: " + order.getStatus());
        }

        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> notFound("Plumber not found: " + plumberId));
        if (plumber.getRole() != Role.PLUMBER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned user is not a plumber");
        }

        OrderStatus prev = order.getStatus();
        order.setPlumber(plumber);
        order.setStatus(OrderStatus.ACCEPTED);
        order.setAcceptedAt(LocalDateTime.now());

        ServiceOrder saved = orderRepository.save(order);
        recordHistory(orderId, prev, OrderStatus.ACCEPTED, actor, "Order accepted by plumber");

        // Save to Outbox
        saveToOutbox(String.valueOf(orderId), "ORDER_ACCEPTED", "order-accepted",
                "ORDER_ACCEPTED:" + orderId + ":PLUMBER:" + plumberId + ":CUSTOMER:" + order.getCustomer().getId());

        log.info("Order #{} acceptance persisted in outbox.", orderId);

        return saved;
    }

    /**
     * Plumber arrived at the site
     */
    @Transactional
    public ServiceOrder arriveOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        requireAssignedPlumber(order);

        if (order.getStatus() != OrderStatus.ACCEPTED
                && order.getStatus() != OrderStatus.IN_PROGRESS
                && order.getStatus() != OrderStatus.COMBINED_ORDER) {
            throw conflict("Order must be ACCEPTED or active to mark arrival. Current status: " + order.getStatus());
        }

        if (order.getArrivedAt() == null) {
            order.setArrivedAt(LocalDateTime.now());
        }
        ServiceOrder saved = orderRepository.save(order);

        saveToOutbox(String.valueOf(saved.getId()), "ORDER_ARRIVED", "order-arrived",
                "ORDER_ARRIVED:" + saved.getId() + ":PLUMBER:" + order.getPlumber().getId() + ":CUSTOMER:" + order.getCustomer().getId());

        log.info("Plumber arrived at site for order #{}", saved.getId());
        return saved;
    }

    /**
     * Plumber is on-site, work has started
     */
    @Transactional
    public ServiceOrder startOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        requireAssignedPlumber(order);

        if (order.getStatus() == OrderStatus.IN_PROGRESS || order.getStatus() == OrderStatus.COMBINED_ORDER) {
            return order;
        }

        if (order.getStatus() != OrderStatus.ACCEPTED) {
            throw conflict("Order cannot be started from status: " + order.getStatus());
        }

        if (order.getArrivedAt() == null) {
            throw conflict("Order must be marked arrived before work can start.");
        }

        OrderStatus prev = order.getStatus();
        order.setStatus(OrderStatus.IN_PROGRESS);
        if (order.getStartedAt() == null) {
            order.setStartedAt(LocalDateTime.now());
        }
        log.info("Order #{} is now IN_PROGRESS", orderId);

        ServiceOrder saved = orderRepository.save(order);
        recordHistory(orderId, prev, OrderStatus.IN_PROGRESS, actor, "Work started by plumber");
        return saved;
    }

    /**
     * Plumber completes the job — triggers the Billing Engine.
     */
    @Transactional
    public ServiceOrder completeOrder(Long orderId, BigDecimal extraCharge) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        requireAssignedPlumber(order);

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CUSTOMER_CONFIRMED) {
            return order;
        }

        if (order.getStatus() != OrderStatus.IN_PROGRESS
                && order.getStatus() != OrderStatus.WORK_RESUMED
                && order.getStatus() != OrderStatus.COMBINED_ORDER) {
            throw conflict("Order cannot be completed from status: " + order.getStatus());
        }

        OrderStatus prev = order.getStatus();
        LocalDateTime now = LocalDateTime.now();
        order.setCompletedAt(now);
        order.setStatus(OrderStatus.COMPLETED);

        // ---- BILLING ENGINE ----
        // 1. Labour cost
        LocalDateTime startedAt = order.getStartedAt() != null ? order.getStartedAt() : now;
        long minutesWorked = ChronoUnit.MINUTES.between(startedAt, now);
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
        recordHistory(orderId, prev, OrderStatus.COMPLETED, actor, "Job completed by plumber");

        // Publish completion event for inventory reconcile
        saveToOutbox(String.valueOf(orderId), "ORDER_COMPLETED", "order-completed",
                "ORDER_COMPLETED:" + orderId + ":AMOUNT:" + saved.getTotalAmount()
                + ":COMMISSION:" + referralCommission);

        log.info("Order #{} completed. Labour=₹{}, Parts=₹{}, Commission=₹{}, Total=₹{}",
                orderId, saved.getLaborCharge(), saved.getPartsCharge(),
                referralCommission, saved.getTotalAmount());

        return saved;
    }

    /**
     * Customer confirms completion
     */
    @Transactional
    public CustomerConfirmationResponse confirmOrder(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || !order.getCustomer().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the owning customer may confirm completion of this order");
        }

        if (order.getStatus() == OrderStatus.CUSTOMER_CONFIRMED) {
            return new CustomerConfirmationResponse(order.getId(), order.getStatus(), order.getCustomerConfirmedAt(), "Order already confirmed");
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw conflict("Order must be COMPLETED before customer confirmation. Current status: " + order.getStatus());
        }

        OrderStatus prev = order.getStatus();
        order.setStatus(OrderStatus.CUSTOMER_CONFIRMED);
        if (order.getCustomerConfirmedAt() == null) {
            order.setCustomerConfirmedAt(LocalDateTime.now());
        }

        ServiceOrder saved = orderRepository.save(order);
        recordHistory(orderId, prev, OrderStatus.CUSTOMER_CONFIRMED, actor, "Customer confirmed order completion");

        saveToOutbox(String.valueOf(orderId), "ORDER_CUSTOMER_CONFIRMED", "order-confirmed",
                "ORDER_CUSTOMER_CONFIRMED:" + orderId + ":CUSTOMER:" + actor.getId());

        log.info("Order #{} confirmed by customer", orderId);
        return new CustomerConfirmationResponse(saved.getId(), saved.getStatus(), saved.getCustomerConfirmedAt(), "Order confirmed successfully");
    }

    /**
     * Customer submits rating and review
     */
    @Transactional
    public RatingResponse submitRating(Long orderId, Integer rating, String comment) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || !order.getCustomer().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the owning customer may rate this order");
        }

        if (order.getStatus() != OrderStatus.CUSTOMER_CONFIRMED && order.getStatus() != OrderStatus.COMPLETED) {
            throw conflict("Order must be completed or confirmed before submitting rating. Current status: " + order.getStatus());
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be an integer between 1 and 5");
        }

        if (comment != null && comment.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment maximum length is 1000 characters");
        }

        if (order.getRating() != null) {
            throw conflict("Rating has already been submitted for order #" + orderId);
        }

        order.setRating(rating);
        order.setComment(comment);
        order.setRatedAt(LocalDateTime.now());

        if (order.getStatus() == OrderStatus.COMPLETED) {
            order.setStatus(OrderStatus.CUSTOMER_CONFIRMED);
            order.setCustomerConfirmedAt(LocalDateTime.now());
            recordHistory(orderId, OrderStatus.COMPLETED, OrderStatus.CUSTOMER_CONFIRMED, actor, "Rating submitted by customer");
        }

        ServiceOrder saved = orderRepository.save(order);

        return new RatingResponse(
                saved.getId(),
                saved.getCustomer().getId(),
                saved.getPlumber() != null ? saved.getPlumber().getId() : null,
                saved.getRating(),
                saved.getComment(),
                saved.getRatedAt()
        );
    }

    /**
     * Retrieve rating for service order
     */
    @Transactional(readOnly = true)
    public RatingResponse getRating(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        boolean allowed = actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.SUPER_ADMIN
                || (actor.getRole() == Role.CUSTOMER && order.getCustomer().getId().equals(actor.getId()))
                || (actor.getRole() == Role.PLUMBER && order.getPlumber() != null && order.getPlumber().getId().equals(actor.getId()))
                || (actor.getRole() == Role.STORE_MANAGER && order.getStore() != null && order.getStore().getManager().getId().equals(actor.getId()));
        if (!allowed) {
            throw new AccessDeniedException("Not authorized to view rating for order " + orderId);
        }

        if (order.getRating() == null) {
            throw notFound("Rating not found for order #" + orderId);
        }

        return new RatingResponse(
                order.getId(),
                order.getCustomer().getId(),
                order.getPlumber() != null ? order.getPlumber().getId() : null,
                order.getRating(),
                order.getComment(),
                order.getRatedAt()
        );
    }

    /**
     * Retrieve status history for service order
     */
    @Transactional(readOnly = true)
    public List<ServiceOrderStatusHistoryResponse> getHistory(Long orderId) {
        ServiceOrder order = getOrderOrThrow(orderId);
        User actor = currentUser.require();
        boolean allowed = actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.SUPER_ADMIN
                || (actor.getRole() == Role.CUSTOMER && order.getCustomer().getId().equals(actor.getId()))
                || (actor.getRole() == Role.PLUMBER && order.getPlumber() != null && order.getPlumber().getId().equals(actor.getId()))
                || (actor.getRole() == Role.STORE_MANAGER && order.getStore() != null && order.getStore().getManager().getId().equals(actor.getId()));
        if (!allowed) {
            throw new AccessDeniedException("Not authorized to view history for order " + orderId);
        }

        List<ServiceOrderStatusHistory> histories = historyRepository.findByServiceOrderIdOrderByCreatedAtAsc(orderId);
        return histories.stream()
                .map(h -> new ServiceOrderStatusHistoryResponse(
                        h.getId(),
                        h.getServiceOrderId(),
                        h.getPreviousStatus(),
                        h.getNewStatus(),
                        h.getNewStatus(),
                        h.getActorId(),
                        h.getActorRole(),
                        h.getReason(),
                        h.getCreatedAt(),
                        h.getCreatedAt()
                ))
                .toList();
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
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw conflict("Cannot cancel a completed order.");
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

    public List<ServiceOrder> getOrdersByPlumber(Long plumberId) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.ADMIN && !actor.getId().equals(plumberId)) {
            throw new AccessDeniedException("Plumbers may view only their own orders");
        }
        return orderRepository.findByPlumber_Id(plumberId);
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
                .orElseThrow(() -> notFound("Service order not found: " + id));
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
