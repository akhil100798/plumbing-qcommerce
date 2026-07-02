package com.pqc.core.service.notification;

import com.pqc.core.util.PhoneMaskingUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
@Slf4j
public class NoOpSmsSender implements SmsSender {
    @Override
    public void sendOtp(String phoneNumber, String otp) {
        log.info("[SMS SERVICE - NOOP] Generating OTP text event for phone: {}. Code transmission simulated.", 
                PhoneMaskingUtil.mask(phoneNumber));
        // Under no circumstances should the OTP itself be logged in plaintext
    }
}
