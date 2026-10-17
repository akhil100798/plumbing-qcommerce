package com.pqc.core.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record DiagnosisDraftRequest(
        @NotBlank @Size(max = 500) String affectedComponent,
        @NotBlank @Size(max = 4000) String observedCondition,
        @NotBlank @Size(max = 8000) String diagnosisNarrative,
        @NotBlank @Size(max = 4000) String recommendedRemedy,
        @NotNull @DecimalMin("0.01") BigDecimal estimatedLaborUnits,
        @Size(max = 4000) String knownMaterialCandidates,
        @Size(max = 4000) String safetyNotes,
        boolean safetyBlocked) { }
