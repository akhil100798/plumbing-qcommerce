package com.pqc.core.dto;

import com.pqc.core.util.PhoneMaskingUtil;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(?:\\d{10}|\\+91 ?\\d{10})$", message = "Phone number must be a ten-digit Indian number, optionally prefixed with +91")
    private String phone;

    private String code;

    @Override
    public String toString() {
        return "OtpRequest(phone=" + PhoneMaskingUtil.mask(phone) + ", code=[REDACTED])";
    }
}
