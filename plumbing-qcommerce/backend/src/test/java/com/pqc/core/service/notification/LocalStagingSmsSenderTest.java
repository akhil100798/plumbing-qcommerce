package com.pqc.core.service.notification;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.pqc.core.config.OtpProperties;
import com.pqc.core.util.PhoneMaskingUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LocalStagingSmsSenderTest {
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private LocalStagingSmsSender sender;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        OtpProperties otpProperties = new OtpProperties();
        otpProperties.setExpirySeconds(300);
        sender = new LocalStagingSmsSender(redisTemplate, otpProperties);
    }

    @Test
    void storesOtpWithTtlUsingHashedPhoneKey() {
        String phone = "+91 9876543210";
        String otp = "654321";

        sender.sendOtp(phone, otp);

        String key = LocalStagingSmsSender.keyFor(phone);
        assertThat(key).startsWith("local-staging:otp:").doesNotContain("9876543210");
        verify(valueOperations).set(key, otp, 300, TimeUnit.SECONDS);
        assertThat(sender).isInstanceOf(SmsSender.class);
    }

    @Test
    void logsMaskedPhoneWithoutOtpOrFullPhone() {
        String phone = "+91 9876543210";
        String otp = "654321";
        Logger logger = (Logger) LoggerFactory.getLogger(LocalStagingSmsSender.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            sender.sendOtp(phone, otp);
        } finally {
            logger.detachAppender(appender);
        }

        String logs = appender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .reduce("", (left, right) -> left + right);
        assertThat(logs).contains(PhoneMaskingUtil.mask(phone));
        assertThat(logs).doesNotContain(otp).doesNotContain(phone).doesNotContain("9876543210");
    }
}
