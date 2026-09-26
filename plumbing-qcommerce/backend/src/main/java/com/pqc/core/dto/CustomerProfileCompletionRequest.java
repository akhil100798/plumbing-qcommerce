package com.pqc.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileCompletionRequest {
    @NotBlank(message = "fullName is required")
    private String fullName;

    @NotBlank(message = "phone is required")
    @Pattern(regexp = "^(\\+91)?[6789]\\d{9}$", message = "Invalid phone number format")
    private String phone;

    @NotBlank(message = "addressLine1 is required")
    private String addressLine1;

    @NotBlank(message = "city is required")
    private String city;

    @NotBlank(message = "state is required")
    private String state;

    @NotBlank(message = "pincode is required")
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be exactly 6 digits")
    private String pincode;

    private String landmark;
}
