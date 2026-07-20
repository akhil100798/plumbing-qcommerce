package com.pqc.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lightweight summary DTO for material request list endpoints.
 * Safe for plumber, store, and admin list views.
 */
public record MaterialRequestSummaryResponse(
        Long id,
        Long serviceOrderId,
        Long storeId,
        String storeName,
        Long plumberId,
        String plumberName,
        Long customerId,
        String customerName,
        String status,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime storeConfirmedAt,
        LocalDateTime plumberArrivedAt,
        LocalDateTime plumberCollectedAt,
        LocalDateTime collectionConfirmedAt
) {}
