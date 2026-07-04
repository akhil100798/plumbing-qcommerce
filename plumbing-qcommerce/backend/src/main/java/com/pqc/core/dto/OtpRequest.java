package com.pqc.core.dto;

import com.pqc.core.util.PhoneMaskingUtil;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+91\\s\\d{10}$", message = "Phone number must match format '+91 XXXXXXXXXX'")
    private String phone;

    private String code;

    @Override
    public String toString() {
        return "OtpRequest(phone=" + PhoneMaskingUtil.mask(phone) + ", code=[REDACTED])";
    }
}
