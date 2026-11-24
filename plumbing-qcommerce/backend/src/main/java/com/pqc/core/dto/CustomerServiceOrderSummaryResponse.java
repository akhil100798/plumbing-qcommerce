package com.pqc.core.dto;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerServiceOrderSummaryResponse(
        Long id, OrderStatus status, RequestType requestType, String description,
        BigDecimal totalAmount, String plumberName, LocalDateTime createdAt,
        LocalDateTime estimatedArrivalAt) {}
