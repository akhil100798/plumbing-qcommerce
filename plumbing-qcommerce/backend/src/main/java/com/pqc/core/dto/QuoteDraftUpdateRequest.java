package com.pqc.core.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record QuoteDraftUpdateRequest(@NotNull Long pricingCatalogLineId, @NotNull BigDecimal quantity) {}
