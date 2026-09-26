package com.pqc.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Full detail DTO for a single material request.
 * Used for GET /plumber/material-requests/{id}, GET /store/material-requests/{id},
 * and GET /admin/material-requests/{id}.
 */
public record MaterialRequestDetailResponse(
        Long id,
        Long serviceOrderId,
        Long storeId,
        String storeName,
        String storeAddress,
        Long plumberId,
        String plumberName,
        Long customerId,
        String customerName,
        String status,
        String notes,
        BigDecimal totalAmount,
        List<MaterialRequestItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime storeConfirmedAt,
        LocalDateTime plumberArrivedAt,
        LocalDateTime plumberCollectedAt,
        LocalDateTime collectionConfirmedAt
) {}
