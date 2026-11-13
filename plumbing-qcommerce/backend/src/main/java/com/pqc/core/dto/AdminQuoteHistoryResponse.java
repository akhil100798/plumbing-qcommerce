package com.pqc.core.dto;

import com.pqc.core.entity.ServiceQuote;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Read-only operations view of an immutable quote snapshot and its decision history. */
public record AdminQuoteHistoryResponse(Long quoteId, Long orderId, Long diagnosisId,
                                        String kind, String state, Integer version,
                                        Long baseQuoteId, Long supersedesQuoteId,
                                        String currency, BigDecimal laborSubtotal,
                                        BigDecimal knownMaterialSubtotal, BigDecimal total,
                                        Long pricingCatalogId, Integer pricingCatalogVersion,
                                        LocalDateTime createdAt, LocalDateTime publishedAt,
                                        LocalDateTime expiresAt, LocalDateTime approvedAt,
                                        LocalDateTime rejectedAt, LocalDateTime supersededAt,
                                        LocalDateTime cancelledAt,
                                        Long decisionActorId, String decisionReason,
                                        List<QuoteLineResponse> lines) {
    public static AdminQuoteHistoryResponse from(ServiceQuote quote, LocalDateTime supersededAt,
                                                  LocalDateTime cancelledAt, List<QuoteLineResponse> lines) {
        return new AdminQuoteHistoryResponse(quote.getId(), quote.getServiceOrder().getId(),
                quote.getDiagnosis() == null ? null : quote.getDiagnosis().getId(),
                quote.getQuoteKind().name(), quote.getState().name(), quote.getVersion(),
                quote.getBaseQuote() == null ? null : quote.getBaseQuote().getId(),
                quote.getSupersedesQuoteId(),
                quote.getCurrency(), quote.getLaborSubtotal(), quote.getKnownMaterialSubtotal(),
                quote.getAmount(), quote.getPricingCatalogId(), quote.getPricingCatalogVersion(),
                quote.getCreatedAt(), quote.getPublishedAt(), quote.getExpiresAt(),
                quote.getApprovedAt(), quote.getRejectedAt(), supersededAt, cancelledAt,
                quote.getDecisionActorId(), quote.getDecisionReason(), lines);
    }
}
