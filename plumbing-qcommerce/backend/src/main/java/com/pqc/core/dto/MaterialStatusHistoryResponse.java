package com.pqc.core.dto;

import java.time.LocalDateTime;

/**
 * DTO for a single status history entry.
 * Returned by GET /api/v1/material-requests/{id}/history
 */
public record MaterialStatusHistoryResponse(
        Long id,
        String previousStatus,
        String newStatus,
        Long actorId,
        String actorRole,
        String reason,
        LocalDateTime createdAt
) {}
