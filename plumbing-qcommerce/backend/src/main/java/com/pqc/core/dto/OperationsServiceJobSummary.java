package com.pqc.core.dto;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;

import java.time.LocalDateTime;

public record OperationsServiceJobSummary(
        Long jobId,
        String customerName,
        String customerPhone,
        String plumberName,
        String plumberPhone,
        RequestType requestType,
        OrderStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean delayFlag
) {
}
