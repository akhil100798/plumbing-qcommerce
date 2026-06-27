package com.pqc.core.dto;

import com.pqc.core.entity.ProductOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperationsMaterialRequestSummary(
        Long requestId,
        Long serviceOrderId,
        String plumberName,
        String customerName,
        String storeName,
        ProductOrderStatus status,
        BigDecimal amount,
        LocalDateTime createdAt
) {
}
