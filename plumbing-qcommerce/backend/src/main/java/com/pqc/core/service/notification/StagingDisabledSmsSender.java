package com.pqc.core.service.notification;

import com.pqc.core.util.PhoneMaskingUtil;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("staging")
@ConditionalOnProperty(prefix = "app.sms", name = "provider", havingValue = "disabled")
@Slf4j
public class StagingDisabledSmsSender implements SmsSender {
    @PostConstruct
    void logDisabledProvider() {
        log.warn("SMS provider is disabled for staging; OTP/SMS delivery will not be sent externally.");
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        log.warn("SMS delivery skipped for staging disabled provider. Masked phone: {}", PhoneMaskingUtil.mask(phoneNumber));
    }
}