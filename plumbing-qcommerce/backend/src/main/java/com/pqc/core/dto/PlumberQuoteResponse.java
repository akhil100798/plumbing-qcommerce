package com.pqc.core.dto;

import com.pqc.core.entity.ServiceQuote;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PlumberQuoteResponse(Long id, Long orderId, Long diagnosisId, String kind, String state, Integer version,
                                   BigDecimal laborSubtotal, BigDecimal knownMaterialSubtotal, BigDecimal total,
                                   String currency, Long pricingCatalogId, Integer pricingCatalogVersion,
                                   LocalDateTime publishedAt, LocalDateTime expiresAt, LocalDateTime approvedAt,
                                   LocalDateTime rejectedAt, List<QuoteLineResponse> lines) {
    public static PlumberQuoteResponse from(ServiceQuote q, List<QuoteLineResponse> lines) {
        return new PlumberQuoteResponse(q.getId(), q.getServiceOrder().getId(), q.getDiagnosis() == null ? null : q.getDiagnosis().getId(),
                q.getQuoteKind().name(), q.getState().name(), q.getVersion(), q.getLaborSubtotal(), q.getKnownMaterialSubtotal(),
                q.getAmount(), q.getCurrency(), q.getPricingCatalogId(), q.getPricingCatalogVersion(), q.getPublishedAt(), q.getExpiresAt(),
                q.getApprovedAt(), q.getRejectedAt(), lines);
    }
}
