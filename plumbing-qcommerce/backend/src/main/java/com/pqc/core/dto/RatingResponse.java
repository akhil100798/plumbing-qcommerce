package com.pqc.core.dto;

import java.time.LocalDateTime;

public record RatingResponse(
        Long orderId,
        Long customerId,
        Long plumberId,
        Integer rating,
        String comment,
        LocalDateTime ratedAt
) {}
