package com.pqc.core.dto;

import com.pqc.core.entity.*;
import java.time.LocalDateTime;

public record SupportTicketSummary(Long ticketId, String ticketNumber, String requesterName, Role requesterRole, String subject, SupportTicketCategory category, SupportTicketPriority priority, SupportTicketStatus status, String assignedAdminName, Long relatedProductOrderId, Long relatedServiceOrderId, String escalationReason, LocalDateTime createdAt, LocalDateTime updatedAt) {}
