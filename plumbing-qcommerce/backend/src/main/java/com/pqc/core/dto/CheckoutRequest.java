package com.pqc.core.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    @NotNull(message = "Store ID is required")
    private Long storeId;

    @NotEmpty(message = "Items list cannot be empty")
    private List<CartItemDTO> items;
}
