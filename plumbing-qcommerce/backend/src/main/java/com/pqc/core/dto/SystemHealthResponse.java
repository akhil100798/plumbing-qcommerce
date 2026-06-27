package com.pqc.core.dto;

import java.time.LocalDateTime;

public record SystemHealthResponse(
        String backendStatus,
        String databaseStatus,
        String redisStatus,
        String kafkaStatus,
        String edgeServiceStatus,
        LocalDateTime timestamp
) {
}
