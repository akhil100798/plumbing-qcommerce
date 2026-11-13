package com.pqc.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MaterialAddendumLineRequest(@NotNull Long materialRequestId,
                                          @NotNull Long materialItemId,
                                          Long pricingCatalogLineId,
                                          @NotNull @DecimalMin(value = "0.01") BigDecimal quantity) { }
