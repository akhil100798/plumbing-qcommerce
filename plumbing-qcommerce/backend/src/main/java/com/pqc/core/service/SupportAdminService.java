package com.pqc.core.service;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CustomUserDetails;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SupportAdminService {
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final UserRepository userRepository;
    private final ProductOrderRepository productOrderRepository;
    private final ServiceOrderRepository serviceOrderRepository;

    public SupportDashboardResponse dashboard() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return new SupportDashboardResponse(
                supportTicketRepository.countByStatus(SupportTicketStatus.OPEN),
                supportTicketRepository.countByStatus(SupportTicketStatus.IN_PROGRESS),
                supportTicketRepository.countByStatus(SupportTicketStatus.ESCALATED),
                supportTicketRepository.countByStatusAndResolvedAtBetween(SupportTicketStatus.RESOLVED, start, end) + supportTicketRepository.countByStatusAndResolvedAtBetween(SupportTicketStatus.CLOSED, start, end),
                supportTicketRepository.countByPriority(SupportTicketPriority.URGENT),
                supportTicketRepository.countByCategory(SupportTicketCategory.PAYMENT),
                supportTicketRepository.countByCategory(SupportTicketCategory.DELIVERY),
                supportTicketRepository.countByCategory(SupportTicketCategory.SERVICE_JOB) + supportTicketRepository.countByCategory(SupportTicketCategory.PLUMBER_SERVICE),
                null,
                supportTicketRepository.findTop5ByOrderByUpdatedAtDesc().stream().map(this::summary).toList(),
                supportTicketRepository.findTop5ByPriorityOrderByUpdatedAtDesc(SupportTicketPriority.URGENT).stream().map(this::summary).toList(),
                supportTicketRepository.findTop5ByStatusOrderByUpdatedAtDesc(SupportTicketStatus.ESCALATED).stream().map(this::summary).toList());
    }

    public Page<SupportTicketSummary> listTickets(SupportTicketStatus status, SupportTicketPriority priority, SupportTicketCategory category, Role requesterRole, String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "updatedAt", "createdAt"));
        Specification<SupportTicket> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            if (category != null) predicates.add(cb.equal(root.get("category"), category));
            if (requesterRole != null) predicates.add(cb.equal(root.get("requesterRole"), requesterRole));
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("ticketNumber")), like), cb.like(cb.lower(root.get("subject")), like), cb.like(cb.lower(root.get("description")), like)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return supportTicketRepository.findAll(spec, pageable).map(this::summary);
    }

    public SupportTicketDetail getTicket(Long id) { return detail(findTicket(id)); }

    public SupportTicketDetail createTicket(SupportTicketCreateRequest request) {
        User requester = userRepository.findById(required(request.requesterId(), "requesterId")).orElseThrow(() -> notFound("Requester not found"));
        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(nextTicketNumber())
                .requesterId(requester.getId())
                .requesterRole(request.requesterRole() == null ? requester.getRole() : request.requesterRole())
                .relatedProductOrderId(request.relatedProductOrderId())
                .relatedServiceOrderId(request.relatedServiceOrderId())
                .category(request.category() == null ? SupportTicketCategory.OTHER : request.category())
                .priority(request.priority() == null ? SupportTicketPriority.MEDIUM : request.priority())
                .status(SupportTicketStatus.OPEN)
                .subject(nonBlank(request.subject(), "subject"))
                .description(nonBlank(request.description(), "description"))
                .build();
        return detail(supportTicketRepository.save(ticket));
    }

    public SupportMessageResponse addMessage(Long ticketId, SupportMessageRequest request) {
        SupportTicket ticket = findTicket(ticketId);
        User sender = currentUser().orElse(null);
        SupportMessage message = SupportMessage.builder()
                .ticketId(ticket.getId())
                .senderId(sender == null ? null : sender.getId())
                .senderRole(sender == null ? Role.SUPPORT_ADMIN : sender.getRole())
                .message(nonBlank(request.message(), "message"))
                .internalNote(request.internalNote())
                .build();
        ticket.setUpdatedAt(LocalDateTime.now());
        supportTicketRepository.save(ticket);
        return messageResponse(supportMessageRepository.save(message));
    }

    public SupportTicketSummary assignTicket(Long id, SupportAssignRequest request) {
        SupportTicket ticket = findTicket(id);
        User admin = userRepository.findById(required(request.adminUserId(), "adminUserId")).orElseThrow(() -> notFound("Admin user not found"));
        if (!(admin.getRole() == Role.SUPPORT_ADMIN || admin.getRole() == Role.ADMIN || admin.getRole() == Role.SUPER_ADMIN)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket can only be assigned to support-capable admins");
        ticket.setAssignedAdminId(admin.getId());
        return summary(supportTicketRepository.save(ticket));
    }

    public SupportTicketSummary updateStatus(Long id, SupportStatusUpdateRequest request) {
        SupportTicket ticket = findTicket(id);
        SupportTicketStatus next = request.status();
        if (next == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        if (!isAllowed(ticket.getStatus(), next)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid support ticket status transition");
        ticket.setStatus(next);
        if (next == SupportTicketStatus.RESOLVED || next == SupportTicketStatus.CLOSED) ticket.setResolvedAt(LocalDateTime.now());
        return summary(supportTicketRepository.save(ticket));
    }

    public SupportTicketSummary escalateTicket(Long id, SupportEscalateRequest request) {
        SupportTicket ticket = findTicket(id);
        ticket.setStatus(SupportTicketStatus.ESCALATED);
        ticket.setEscalationReason(nonBlank(request.reason(), "reason"));
        return summary(supportTicketRepository.save(ticket));
    }

    public SupportTicketSummary closeTicket(Long id, SupportCloseRequest request) {
        SupportTicket ticket = findTicket(id);
        ticket.setStatus(SupportTicketStatus.CLOSED);
        if (ticket.getResolvedAt() == null) ticket.setResolvedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        String note = nonBlank(request.resolutionNote(), "resolutionNote");
        User sender = currentUser().orElse(null);
        supportMessageRepository.save(SupportMessage.builder().ticketId(id).senderId(sender == null ? null : sender.getId()).senderRole(sender == null ? Role.SUPPORT_ADMIN : sender.getRole()).message(note).internalNote(true).build());
        return summary(saved);
    }

    public SupportUserContextResponse userContext(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> notFound("User not found"));
        List<SupportUserContextResponse.ProductOrderContext> productOrders = productOrderRepository.findByCustomerId(userId).stream().limit(10).map(o -> new SupportUserContextResponse.ProductOrderContext(o.getId(), safe(o.getTotalAmount()), o.getStatus() == null ? "UNKNOWN" : o.getStatus().name(), o.getCreatedAt())).toList();
        List<SupportUserContextResponse.ServiceJobContext> serviceJobs = serviceOrderRepository.findByCustomer_Id(userId).stream().limit(10).map(j -> new SupportUserContextResponse.ServiceJobContext(j.getId(), safe(j.getTotalAmount()), j.getStatus() == null ? "UNKNOWN" : j.getStatus().name(), j.getDescription(), j.getCreatedAt())).toList();
        List<SupportTicketSummary> tickets = supportTicketRepository.findTop10ByRequesterIdOrderByUpdatedAtDesc(userId).stream().map(this::summary).toList();
        return new SupportUserContextResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole(), productOrders, serviceJobs, tickets);
    }

    private SupportTicket findTicket(Long id) { return supportTicketRepository.findById(id).orElseThrow(() -> notFound("Support ticket not found")); }
    private ResponseStatusException notFound(String message) { return new ResponseStatusException(HttpStatus.NOT_FOUND, message); }
    private Long required(Long value, String field) { if (value == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required"); return value; }
    private String nonBlank(String value, String field) { if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required"); return value.trim(); }
    private BigDecimal safe(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private Optional<User> currentUser() { Object principal = SecurityContextHolder.getContext().getAuthentication() == null ? null : SecurityContextHolder.getContext().getAuthentication().getPrincipal(); if (principal instanceof CustomUserDetails details) return userRepository.findByEmail(details.getUsername()); if (principal instanceof String email) return userRepository.findByEmail(email); return Optional.empty(); }

    private String nextTicketNumber() {
        long next = supportTicketRepository.findTopByOrderByIdDesc().map(t -> t.getId() + 1).orElse(1L);
        return String.format("SUP-%06d", next);
    }

    private boolean isAllowed(SupportTicketStatus current, SupportTicketStatus next) {
        if (current == SupportTicketStatus.OPEN) return next == SupportTicketStatus.IN_PROGRESS || next == SupportTicketStatus.ESCALATED;
        if (current == SupportTicketStatus.IN_PROGRESS) return next == SupportTicketStatus.ESCALATED || next == SupportTicketStatus.RESOLVED;
        if (current == SupportTicketStatus.ESCALATED) return next == SupportTicketStatus.IN_PROGRESS || next == SupportTicketStatus.RESOLVED;
        return current == SupportTicketStatus.RESOLVED && next == SupportTicketStatus.CLOSED;
    }

    private SupportTicketSummary summary(SupportTicket ticket) {
        User requester = userRepository.findById(ticket.getRequesterId()).orElse(null);
        User admin = ticket.getAssignedAdminId() == null ? null : userRepository.findById(ticket.getAssignedAdminId()).orElse(null);
        return new SupportTicketSummary(ticket.getId(), ticket.getTicketNumber(), name(requester), ticket.getRequesterRole(), ticket.getSubject(), ticket.getCategory(), ticket.getPriority(), ticket.getStatus(), name(admin), ticket.getRelatedProductOrderId(), ticket.getRelatedServiceOrderId(), ticket.getEscalationReason(), ticket.getCreatedAt(), ticket.getUpdatedAt());
    }

    private SupportTicketDetail detail(SupportTicket ticket) {
        User requester = userRepository.findById(ticket.getRequesterId()).orElse(null);
        User admin = ticket.getAssignedAdminId() == null ? null : userRepository.findById(ticket.getAssignedAdminId()).orElse(null);
        ProductOrder productOrder = ticket.getRelatedProductOrderId() == null ? null : productOrderRepository.findById(ticket.getRelatedProductOrderId()).orElse(null);
        ServiceOrder serviceOrder = ticket.getRelatedServiceOrderId() == null ? null : serviceOrderRepository.findById(ticket.getRelatedServiceOrderId()).orElse(null);
        return new SupportTicketDetail(ticket.getId(), ticket.getTicketNumber(), ticket.getRequesterId(), name(requester), requester == null ? null : requester.getEmail(), requester == null ? null : requester.getPhone(), ticket.getRequesterRole(), ticket.getRelatedProductOrderId(), productOrder == null || productOrder.getStatus() == null ? null : productOrder.getStatus().name(), ticket.getRelatedServiceOrderId(), serviceOrder == null || serviceOrder.getStatus() == null ? null : serviceOrder.getStatus().name(), ticket.getCategory(), ticket.getPriority(), ticket.getStatus(), ticket.getSubject(), ticket.getDescription(), ticket.getAssignedAdminId(), name(admin), ticket.getEscalationReason(), supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream().map(this::messageResponse).toList(), ticket.getCreatedAt(), ticket.getUpdatedAt(), ticket.getResolvedAt());
    }

    private SupportMessageResponse messageResponse(SupportMessage message) {
        User sender = message.getSenderId() == null ? null : userRepository.findById(message.getSenderId()).orElse(null);
        return new SupportMessageResponse(message.getId(), message.getTicketId(), message.getSenderId(), name(sender), message.getSenderRole(), message.getMessage(), message.isInternalNote(), message.getCreatedAt());
    }

    private String name(User user) { return user == null ? "UNKNOWN" : user.getFullName(); }
}