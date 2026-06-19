package com.pqc.core.api.order;

import com.pqc.core.entity.RequestType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotBlank String description,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        RequestType requestType
) {
    public RequestType resolvedRequestType() {
        return requestType == null ? RequestType.NEARBY_AUTO : requestType;
    }
}
