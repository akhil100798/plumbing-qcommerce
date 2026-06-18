package com.pqc.core.api;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiError(
        LocalDateTime timestamp,
        int status,
        String code,
        String message,
        String path,
        String correlationId,
        Map<String, String> fieldErrors
) {
}
