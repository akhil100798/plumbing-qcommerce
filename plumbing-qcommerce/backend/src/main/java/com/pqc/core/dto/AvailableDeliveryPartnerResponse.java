package com.pqc.core.dto;

public record AvailableDeliveryPartnerResponse(
        Long id,
        String name,
        String phone,
        String currentStatus,
        String lastKnownLocation,
        Long activeDeliveryCount
) {
}
