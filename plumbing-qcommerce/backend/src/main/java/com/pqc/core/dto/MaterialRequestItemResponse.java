package com.pqc.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Safe DTO for material-request item responses — no JPA entity leakage.
 */
public record MaterialRequestItemResponse(
        Long productId,
        String productName,
        String sku,
        BigDecimal unitPrice,
        Integer requestedQuantity,
        Integer reservedQuantity
) {}
