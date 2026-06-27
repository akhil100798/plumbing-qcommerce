package com.pqc.core.dto;

import lombok.Data;

/**
 * DTO for POST /api/v1/orders — Customer creates a service request.
 * BUG-11 fix: Replaces raw Map<String,Object> to prevent NPE on wrong field names.
 */
@Data
public class CreateOrderRequest {
    private String description;
    private Double latitude;
    private Double longitude;
    private String requestType = "NEARBY_AUTO";
}
