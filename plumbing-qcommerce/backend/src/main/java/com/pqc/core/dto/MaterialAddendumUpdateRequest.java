package com.pqc.core.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record MaterialAddendumUpdateRequest(@NotNull Long materialRequestId,
                                            Long pricingCatalogId,
                                            @NotEmpty List<@Valid MaterialAddendumLineRequest> lines) { }
