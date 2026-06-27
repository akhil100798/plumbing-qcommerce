package com.pqc.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FinancePaymentSummary(
        String paymentId,
        Long orderId,
        String customerName,
        BigDecimal amount,
        String status,
        String paymentMethod,
        String transactionReference,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}