package com.pqc.core.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    @NotNull(message = "Store ID is required")
    @Positive(message = "Store ID must be positive")
    private Long storeId;

    @NotEmpty(message = "Items list cannot be empty")
    private List<@jakarta.validation.Valid CartItemDTO> items;
}
