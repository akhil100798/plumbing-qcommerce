package com.pqc.core.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PlumberKycSubmissionRequest(
        @NotBlank @Pattern(regexp = "\\d{12}", message = "aadhaarNumber must contain 12 digits") String aadhaarNumber,
        @NotBlank @Pattern(regexp = "[A-Za-z]{5}[0-9]{4}[A-Za-z]", message = "panNumber is invalid") String panNumber,
        @NotBlank @Pattern(regexp = "\\d{6,18}", message = "bankAccountNumber is invalid") String bankAccountNumber,
        @Min(0) @Max(60) Integer experienceYears,
        @NotBlank String serviceAreas
) {}
