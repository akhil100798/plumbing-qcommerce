package com.pqc.core.dto;

import com.pqc.core.entity.ProductOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperationsProductOrderSummary(
        Long orderId,
        String customerName,
        String customerPhone,
        String storeName,
        BigDecimal totalAmount,
        ProductOrderStatus status,
        String paymentStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String deliveryPartnerName,
        boolean delayFlag
) {
}
