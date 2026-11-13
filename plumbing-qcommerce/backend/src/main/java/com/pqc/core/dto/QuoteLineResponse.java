package com.pqc.core.dto;

import com.pqc.core.entity.ServiceQuoteLine;
import java.math.BigDecimal;

public record QuoteLineResponse(String lineType, String description, BigDecimal quantity, String unit,
                                BigDecimal unitPrice, BigDecimal lineTotal) {
    public static QuoteLineResponse from(ServiceQuoteLine l) {
        return new QuoteLineResponse(l.getLineType(), l.getDescription(), l.getQuantity(), l.getUnit(), l.getUnitPrice(), l.getLineTotal());
    }
}
