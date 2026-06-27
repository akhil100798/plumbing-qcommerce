package com.pqc.core.dto;

import com.pqc.core.entity.Role;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SupportUserContextResponse(Long userId, String fullName, String email, String phone, Role role, List<ProductOrderContext> recentProductOrders, List<ServiceJobContext> recentServiceJobs, List<SupportTicketSummary> previousTickets) {
    public record ProductOrderContext(Long orderId, BigDecimal totalAmount, String status, LocalDateTime createdAt) {}
    public record ServiceJobContext(Long jobId, BigDecimal totalAmount, String status, String description, LocalDateTime createdAt) {}
}
