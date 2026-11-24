package com.pqc.core.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record MaterialAddendumCreateRequest(@NotNull Long baseQuoteId,
                                            Long supersedesAddendumId,
                                            Long pricingCatalogId,
                                            String reason,
                                            @NotEmpty List<@Valid MaterialAddendumLineRequest> lines) { }
