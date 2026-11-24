package com.pqc.core.dto;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerServiceOrderDetailResponse(
        Long id, OrderStatus status, RequestType requestType, String description,
        String issueCategory, String urgency, LocalDateTime scheduledFor,
        String addressLine1, String addressLine2, String landmark, String city, String postalCode,
        String customerPhoneSnapshot, Double customerLatitude, Double customerLongitude,
        BigDecimal visitFee, String currency, BigDecimal laborCharge, BigDecimal partsCharge, BigDecimal platformFee,
        BigDecimal totalAmount, String plumberName, String plumberPhone,
        LocalDateTime createdAt, LocalDateTime acceptedAt, LocalDateTime arrivedAt,
        LocalDateTime startedAt, LocalDateTime completedAt, LocalDateTime estimatedArrivalAt) {}
