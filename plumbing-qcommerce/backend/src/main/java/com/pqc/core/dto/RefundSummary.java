package com.pqc.core.dto;

import com.pqc.core.entity.RefundStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundSummary(
        Long refundId,
        Long orderId,
        String customerName,
        BigDecimal amount,
        String reason,
        RefundStatus status,
        LocalDateTime requestedAt,
        LocalDateTime processedAt
) {
}