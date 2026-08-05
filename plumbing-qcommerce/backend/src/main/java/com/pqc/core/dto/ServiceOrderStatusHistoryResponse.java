package com.pqc.core.dto;

import java.time.LocalDateTime;

public record ServiceOrderStatusHistoryResponse(
        Long id,
        Long serviceOrderId,
        String previousStatus,
        String newStatus,
        String status,
        Long actorId,
        String actorRole,
        String reason,
        LocalDateTime createdAt,
        LocalDateTime timestamp
) {}
