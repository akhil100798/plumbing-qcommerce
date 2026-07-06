package com.pqc.core.service.notification;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;

class StagingDisabledSmsSenderTest {
    @Test
    void sendOtpDoesNotExposeOtpOrThrow() {
        StagingDisabledSmsSender sender = new StagingDisabledSmsSender();

        assertThatCode(() -> sender.sendOtp("+919999999999", "123456")).doesNotThrowAnyException();
    }
}