package com.pqc.core.dto;

import com.pqc.core.entity.SettlementStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DeliveryPayoutSummary(
        Long payoutId,
        Long deliveryPartnerId,
        String deliveryPartnerName,
        long completedDeliveries,
        BigDecimal grossAmount,
        BigDecimal commissionAmount,
        BigDecimal netAmount,
        SettlementStatus status,
        LocalDateTime createdAt,
        LocalDateTime paidAt
) {
}