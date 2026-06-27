package com.pqc.core.dto;

import java.math.BigDecimal;

public record FinanceDashboardResponse(
        BigDecimal totalRevenue,
        BigDecimal todayRevenue,
        long totalPayments,
        long successfulPayments,
        long failedPayments,
        long pendingPayments,
        long totalRefunds,
        long pendingRefunds,
        long totalStoreSettlements,
        long pendingStoreSettlements,
        long totalPlumberPayouts,
        long pendingPlumberPayouts,
        long totalDeliveryPayouts,
        long pendingDeliveryPayouts,
        BigDecimal platformCommission,
        BigDecimal walletBalanceTotal
) {
}