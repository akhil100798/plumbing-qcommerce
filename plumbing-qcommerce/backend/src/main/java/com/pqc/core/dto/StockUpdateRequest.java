package com.pqc.core.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockUpdateRequest {
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer quantity;
}
