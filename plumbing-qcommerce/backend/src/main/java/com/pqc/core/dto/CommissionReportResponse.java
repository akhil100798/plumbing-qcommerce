package com.pqc.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CommissionReportResponse(
        BigDecimal totalGrossRevenue,
        BigDecimal totalCommission,
        BigDecimal storeCommission,
        BigDecimal plumberCommission,
        BigDecimal deliveryCommission,
        BigDecimal netPayable,
        LocalDateTime reportGeneratedAt
) {
}