package com.pqc.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FinancePaymentDetail(
        String paymentId,
        Long orderId,
        String orderType,
        String customerName,
        String customerPhone,
        String customerEmail,
        BigDecimal amount,
        String status,
        String paymentMethod,
        String gatewayReference,
        String transactionStatus,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}