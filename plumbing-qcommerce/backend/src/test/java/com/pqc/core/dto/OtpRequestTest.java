package com.pqc.core.dto;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OtpRequestTest {
    @Test
    void toStringMasksPhoneAndRedactsCode() {
        OtpRequest request = new OtpRequest();
        request.setPhone("+91 9000000001");
        request.setCode("654321");

        assertThat(request.toString())
                .contains("+91*******0001")
                .contains("code=[REDACTED]")
                .doesNotContain("+91 9000000001")
                .doesNotContain("654321");
    }
}
