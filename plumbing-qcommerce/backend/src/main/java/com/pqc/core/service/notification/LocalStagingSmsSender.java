package com.pqc.core.service.notification;

import com.pqc.core.config.OtpProperties;
import com.pqc.core.util.PhoneMaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;

@Component
@Profile("local-staging")
@ConditionalOnProperty(
        prefix = "app.sms",
        name = "local-capture-enabled",
        havingValue = "true",
        matchIfMissing = false
)
@RequiredArgsConstructor
@Slf4j
public class LocalStagingSmsSender implements SmsSender {
    private static final String KEY_PREFIX = "local-staging:otp:";

    private final StringRedisTemplate redisTemplate;
    private final OtpProperties otpProperties;

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        redisTemplate.opsForValue().set(
                keyFor(phoneNumber),
                otp,
                otpProperties.getExpirySeconds(),
                TimeUnit.SECONDS
        );
        log.info("Local staging OTP captured for masked phone {}", PhoneMaskingUtil.mask(phoneNumber));
    }

    static String keyFor(String phoneNumber) {
        String normalizedPhone = phoneNumber == null ? "" : phoneNumber.replaceAll("\\D", "");
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(normalizedPhone.getBytes(StandardCharsets.UTF_8));
            return KEY_PREFIX + HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
