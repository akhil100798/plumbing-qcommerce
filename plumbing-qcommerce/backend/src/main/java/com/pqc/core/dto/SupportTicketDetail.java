package com.pqc.core.dto;

import com.pqc.core.entity.*;
import java.time.LocalDateTime;
import java.util.List;

public record SupportTicketDetail(Long ticketId, String ticketNumber, Long requesterId, String requesterName, String requesterEmail, String requesterPhone, Role requesterRole, Long relatedProductOrderId, String productOrderStatus, Long relatedServiceOrderId, String serviceOrderStatus, SupportTicketCategory category, SupportTicketPriority priority, SupportTicketStatus status, String subject, String description, Long assignedAdminId, String assignedAdminName, String escalationReason, List<SupportMessageResponse> messages, LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime resolvedAt) {}
