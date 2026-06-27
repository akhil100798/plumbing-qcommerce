package com.pqc.core.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackOrderRequest {
    @NotNull(message = "Store ID is required")
    private Long storeId;
    private String packingNote;
}
