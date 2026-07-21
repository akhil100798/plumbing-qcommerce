package com.pqc.core.dto;

import com.pqc.core.entity.OrderStatus;
import java.time.LocalDateTime;

public record CustomerConfirmationResponse(
        Long id,
        OrderStatus status,
        LocalDateTime customerConfirmedAt,
        String message
) {}
