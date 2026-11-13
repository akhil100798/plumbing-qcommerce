package com.pqc.core.dto;

import jakarta.validation.constraints.NotBlank;

public record QuoteRejectRequest(@NotBlank String reason) {}
