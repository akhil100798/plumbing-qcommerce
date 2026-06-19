package com.pqc.core.api.order;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record CompleteOrderRequest(
        @DecimalMin("0.00") BigDecimal partsCharge
) {
    public BigDecimal resolvedPartsCharge() {
        return partsCharge == null ? BigDecimal.ZERO : partsCharge;
    }
}
