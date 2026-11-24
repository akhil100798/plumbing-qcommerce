package com.pqc.core.dto;

import com.pqc.core.entity.Phase2Reconciliation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record Phase2ReconciliationResponse(Long id, Long serviceOrderId,
                                           BigDecimal authorizedRepairAmount,
                                           BigDecimal legacyRepairAmount,
                                           BigDecimal varianceAmount,
                                           String status, String correctionType,
                                           Long correctionQuoteId, Long correctionAddendumId,
                                           LocalDateTime createdAt, LocalDateTime resolvedAt,
                                           String reason, String resolution) {
    public static Phase2ReconciliationResponse from(Phase2Reconciliation row) {
        return new Phase2ReconciliationResponse(row.getId(), row.getServiceOrderId(),
                row.getAuthorizedRepairAmount(), row.getLegacyRepairAmount(), row.getVarianceAmount(),
                row.getStatus().name(), row.getCorrectionType(), row.getCorrectionQuoteId(),
                row.getCorrectionAddendumId(), row.getCreatedAt(), row.getResolvedAt(),
                row.getReason(), row.getResolution());
    }
}
