package com.pqc.core.dto;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PlumberJobDetailResponse(
        Long id, OrderStatus status, RequestType requestType, String description,
        String issueCategory, String urgency, LocalDateTime scheduledFor,
        String addressLine1, String addressLine2, String landmark, String city, String postalCode,
        Double customerLatitude, Double customerLongitude,
        String customerName, String customerPhone, BigDecimal totalAmount,
        LocalDateTime createdAt, LocalDateTime acceptedAt, LocalDateTime arrivedAt,
        LocalDateTime startedAt, LocalDateTime completedAt) {}
