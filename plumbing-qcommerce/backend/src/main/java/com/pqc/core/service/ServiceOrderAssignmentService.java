package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceOrderAssignmentService {
    private static final EnumSet<ServiceOrderAssignmentStatus> CURRENT =
            EnumSet.of(ServiceOrderAssignmentStatus.ASSIGNED, ServiceOrderAssignmentStatus.ACCEPTED);

    private final ServiceOrderRepository orderRepository;
    private final ServiceOrderAssignmentRepository assignmentRepository;
    private final ServiceOrderPlumberDispositionRepository dispositionRepository;
    private final UserRepository userRepository;
    private final PlumberEligibilityService eligibilityService;
    private final CurrentUser currentUser;
    private final ServiceOrderStatusHistoryRepository historyRepository;
    private final OutboxEventRepository outboxRepository;

    @Transactional
    public ServiceOrder accept(Long orderId, Long plumberId) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.PLUMBER || !actor.getId().equals(plumberId)) {
            throw new org.springframework.security.access.AccessDeniedException("Plumbers may accept orders only as themselves");
        }
        ServiceOrder order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service order not found"));
        if (order.getStatus() != OrderStatus.PENDING) {
            if (order.getPlumber() != null && order.getPlumber().getId().equals(plumberId)) return order;
            throw conflict("Order is no longer available");
        }
        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plumber not found"));
        if (!eligibilityService.isEligibleForLaunch(plumber)) throw conflict("Plumber is not eligible for launch assignment");
        if (dispositionRepository.existsByServiceOrderIdAndPlumberIdAndDisposition(orderId, plumberId, PlumberJobDisposition.DECLINED)) {
            throw conflict("Order was already declined by this plumber");
        }
        assignLocked(order, plumber, ServiceOrderAssignmentMode.FIRST_ACCEPT, ServiceOrderAssignmentStatus.ACCEPTED, actor, "First eligible plumber accepted");
        return orderRepository.save(order);
    }

    @Transactional
    public ServiceOrder assignByOperator(Long orderId, Long plumberId, String reason) {
        return assignByOperator(orderId, plumberId, reason, true);
    }

    @Transactional
    public ServiceOrder assignInitiallyByOperator(Long orderId, Long plumberId, String reason) {
        return assignByOperator(orderId, plumberId, reason, false);
    }

    private ServiceOrder assignByOperator(Long orderId, Long plumberId, String reason, boolean allowReassignment) {
        if (reason == null || reason.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment reason is required");
        User actor = currentUser.require();
        ServiceOrder order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service order not found"));
        if (!isOperatorAssignable(order)) {
            throw conflict("Service order is not assignable in status " + order.getStatus());
        }
        if (!allowReassignment && assignmentRepository.existsByServiceOrderIdAndStatusIn(orderId, CURRENT)) {
            throw conflict("Order is already assigned");
        }
        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plumber not found"));
        if (plumber.getRole() != Role.PLUMBER || !eligibilityService.isEligibleForLaunch(plumber)) throw conflict("Plumber is not eligible for launch assignment");
        assignmentRepository.findByServiceOrderIdAndStatusIn(orderId, CURRENT).forEach(a -> { a.setStatus(ServiceOrderAssignmentStatus.REASSIGNED); assignmentRepository.save(a); });
        assignLocked(order, plumber, ServiceOrderAssignmentMode.OPERATOR, ServiceOrderAssignmentStatus.ASSIGNED, actor, reason);
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderAssignment> history(Long orderId) { return assignmentRepository.findByServiceOrderIdOrderByCreatedAtAsc(orderId); }

    @Transactional
    public void cancelCurrent(Long orderId, User actor, String reason) {
        assignmentRepository.findByServiceOrderIdAndStatusIn(orderId, CURRENT).forEach(a -> { a.setStatus(ServiceOrderAssignmentStatus.CANCELLED); assignmentRepository.save(a); });
    }

    private void assignLocked(ServiceOrder order, User plumber, ServiceOrderAssignmentMode mode, ServiceOrderAssignmentStatus status, User actor, String reason) {
        if (assignmentRepository.existsByServiceOrderIdAndStatusIn(order.getId(), CURRENT)) throw conflict("Order is already assigned");
        OrderStatus previousStatus = order.getStatus();
        order.setPlumber(plumber);
        order.setAssignedAt(LocalDateTime.now());
        if (order.getAcceptedAt() == null) order.setAcceptedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.ACCEPTED);
        ServiceOrderAssignment assignment = assignmentRepository.save(ServiceOrderAssignment.builder()
                .serviceOrderId(order.getId()).plumberId(plumber.getId()).status(status).assignmentMode(mode)
                .actorId(actor == null ? null : actor.getId()).actorRole(actor == null ? null : actor.getRole().name()).reason(reason).build());
        historyRepository.save(ServiceOrderStatusHistory.builder().serviceOrderId(order.getId()).previousStatus(previousStatus.name())
                .newStatus(OrderStatus.ACCEPTED.name()).actorId(actor == null ? null : actor.getId()).actorRole(actor == null ? null : actor.getRole().name())
                .reason("Service order assigned to plumber " + plumber.getId()).build());
        outboxRepository.save(OutboxEvent.builder().aggregateId(String.valueOf(order.getId())).aggregateType("SERVICE_ORDER")
                .eventType("SERVICE_ORDER_ASSIGNED").topic("service-order-assigned").payload("SERVICE_ORDER_ASSIGNED:" + order.getId() + ":PLUMBER:" + plumber.getId()).processed(false).build());
    }

    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }

    private boolean isOperatorAssignable(ServiceOrder order) {
        return order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.ACCEPTED;
    }
}
