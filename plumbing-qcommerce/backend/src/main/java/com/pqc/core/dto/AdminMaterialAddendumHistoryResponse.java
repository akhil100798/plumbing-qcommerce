package com.pqc.core.dto;

import com.pqc.core.entity.ServiceQuote;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminMaterialAddendumHistoryResponse(Long id, Long serviceOrderId, Long baseQuoteId,
                                                    Long supersedesQuoteId, String state, Integer version,
                                                    String currency, BigDecimal total, Long pricingCatalogId,
                                                    Integer pricingCatalogVersion, Long decisionActorId,
                                                    String decisionReason, LocalDateTime createdAt,
                                                    LocalDateTime publishedAt, LocalDateTime expiresAt,
                                                    LocalDateTime approvedAt, LocalDateTime rejectedAt,
                                                    LocalDateTime terminalAt,
                                                    List<MaterialAuthorizationHistoryResponse> materialLinks,
                                                    List<QuoteLineResponse> lines) {
    public static AdminMaterialAddendumHistoryResponse from(ServiceQuote quote, LocalDateTime terminalAt,
                                                             List<MaterialAuthorizationHistoryResponse> links,
                                                             List<QuoteLineResponse> lines) {
        return new AdminMaterialAddendumHistoryResponse(quote.getId(), quote.getServiceOrder().getId(),
                quote.getBaseQuote().getId(), quote.getSupersedesQuoteId(), quote.getState().name(),
                quote.getVersion(), quote.getCurrency(), quote.getAmount(), quote.getPricingCatalogId(),
                quote.getPricingCatalogVersion(), quote.getDecisionActorId(), quote.getDecisionReason(),
                quote.getCreatedAt(), quote.getPublishedAt(), quote.getExpiresAt(), quote.getApprovedAt(),
                quote.getRejectedAt(), terminalAt, links, lines);
    }
}
