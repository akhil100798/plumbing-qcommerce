package com.pqc.core.dto;

import com.pqc.core.entity.SettlementStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StoreSettlementSummary(
        Long settlementId,
        Long storeId,
        String storeName,
        BigDecimal grossAmount,
        BigDecimal commissionAmount,
        BigDecimal netAmount,
        SettlementStatus status,
        LocalDateTime createdAt,
        LocalDateTime paidAt
) {
}