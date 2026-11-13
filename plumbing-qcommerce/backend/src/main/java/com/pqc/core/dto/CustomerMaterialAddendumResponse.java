package com.pqc.core.dto;

import com.pqc.core.entity.ServiceQuote;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerMaterialAddendumResponse(Long id, Long baseQuoteId, Long supersedesQuoteId,
                                                String state, Integer version, String currency,
                                                BigDecimal total, LocalDateTime publishedAt,
                                                LocalDateTime expiresAt, LocalDateTime approvedAt,
                                                LocalDateTime rejectedAt, List<QuoteLineResponse> lines) {
    public static CustomerMaterialAddendumResponse from(ServiceQuote quote, List<QuoteLineResponse> lines) {
        return new CustomerMaterialAddendumResponse(quote.getId(), quote.getBaseQuote().getId(),
                quote.getSupersedesQuoteId(), quote.getState().name(), quote.getVersion(), quote.getCurrency(),
                quote.getAmount(), quote.getPublishedAt(), quote.getExpiresAt(), quote.getApprovedAt(),
                quote.getRejectedAt(), lines);
    }
}
