package com.pqc.core.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterCustomerRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 12, max = 72) String password,
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Pattern(regexp = "^[0-9]{10,15}$") String phone
) {
}
