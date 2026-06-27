package com.pqc.core.dto;

import com.pqc.core.entity.*;

public record SupportTicketCreateRequest(Long requesterId, Role requesterRole, Long relatedProductOrderId, Long relatedServiceOrderId, SupportTicketCategory category, SupportTicketPriority priority, String subject, String description) {}
