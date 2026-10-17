package com.pqc.core.dto;

import com.pqc.core.entity.ServiceQuote;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerQuoteResponse(Long id, String kind, String state, Integer version, String currency,
                                    BigDecimal laborSubtotal, BigDecimal knownMaterialSubtotal, BigDecimal total,
                                    LocalDateTime publishedAt, LocalDateTime expiresAt, List<QuoteLineResponse> lines) {
    public static CustomerQuoteResponse from(ServiceQuote q, List<QuoteLineResponse> lines) {
        return new CustomerQuoteResponse(q.getId(), q.getQuoteKind().name(), q.getState().name(), q.getVersion(), q.getCurrency(),
                q.getLaborSubtotal(), q.getKnownMaterialSubtotal(), q.getAmount(), q.getPublishedAt(), q.getExpiresAt(), lines);
    }
}
