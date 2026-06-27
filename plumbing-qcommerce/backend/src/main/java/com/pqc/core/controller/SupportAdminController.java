package com.pqc.core.controller;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.service.SupportAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/support")
@RequiredArgsConstructor
public class SupportAdminController {
    private final SupportAdminService supportAdminService;

    @GetMapping("/dashboard")
    public ResponseEntity<SupportDashboardResponse> dashboard() { return ResponseEntity.ok(supportAdminService.dashboard()); }

    @GetMapping("/tickets")
    public ResponseEntity<Page<SupportTicketSummary>> tickets(@RequestParam(required = false) SupportTicketStatus status, @RequestParam(required = false) SupportTicketPriority priority, @RequestParam(required = false) SupportTicketCategory category, @RequestParam(required = false) Role requesterRole, @RequestParam(required = false) String search, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return ResponseEntity.ok(supportAdminService.listTickets(status, priority, category, requesterRole, search, page, size)); }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<SupportTicketDetail> ticket(@PathVariable Long id) { return ResponseEntity.ok(supportAdminService.getTicket(id)); }

    @PostMapping("/tickets")
    public ResponseEntity<SupportTicketDetail> createTicket(@RequestBody SupportTicketCreateRequest request) { return ResponseEntity.ok(supportAdminService.createTicket(request)); }

    @PostMapping("/tickets/{id}/messages")
    public ResponseEntity<SupportMessageResponse> addMessage(@PathVariable Long id, @RequestBody SupportMessageRequest request) { return ResponseEntity.ok(supportAdminService.addMessage(id, request)); }

    @PatchMapping("/tickets/{id}/assign")
    public ResponseEntity<SupportTicketSummary> assign(@PathVariable Long id, @RequestBody SupportAssignRequest request) { return ResponseEntity.ok(supportAdminService.assignTicket(id, request)); }

    @PatchMapping("/tickets/{id}/status")
    public ResponseEntity<SupportTicketSummary> status(@PathVariable Long id, @RequestBody SupportStatusUpdateRequest request) { return ResponseEntity.ok(supportAdminService.updateStatus(id, request)); }

    @PatchMapping("/tickets/{id}/escalate")
    public ResponseEntity<SupportTicketSummary> escalate(@PathVariable Long id, @RequestBody SupportEscalateRequest request) { return ResponseEntity.ok(supportAdminService.escalateTicket(id, request)); }

    @PatchMapping("/tickets/{id}/close")
    public ResponseEntity<SupportTicketSummary> close(@PathVariable Long id, @RequestBody SupportCloseRequest request) { return ResponseEntity.ok(supportAdminService.closeTicket(id, request)); }

    @GetMapping("/context/user/{userId}")
    public ResponseEntity<SupportUserContextResponse> userContext(@PathVariable Long userId) { return ResponseEntity.ok(supportAdminService.userContext(userId)); }
}