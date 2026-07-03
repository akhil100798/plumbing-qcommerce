package com.pqc.core.service;

import com.pqc.core.config.DeliveryOtpProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryOtpServiceTest {

    private DeliveryOtpService deliveryOtpService;

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    private DeliveryOtpProperties deliveryOtpProperties;
    private static final String HASH_SECRET = "test-hash-secret-key-minimum-32-chars-long";

    @BeforeEach
    void setUp() {
        deliveryOtpProperties = new DeliveryOtpProperties();
        deliveryOtpProperties.setHashSecret(HASH_SECRET);
        deliveryOtpProperties.setLength(6);
        deliveryOtpProperties.setExpirySeconds(900);
        deliveryOtpProperties.setCooldownSeconds(60);
        deliveryOtpProperties.setMaxAttempts(5);
        
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        deliveryOtpService = new DeliveryOtpService(redisTemplate, deliveryOtpProperties);
    }

    @Test
    void generateOtp_success_storesHashInRedisAndSetsCooldown() {
        Long orderId = 123L;
        Long partnerId = 456L;
        String cooldownKey = "delivery-otp:123:456:cooldown";
        String hashKey = "delivery-otp:123:456:hash";
        String attemptsKey = "delivery-otp:123:456:attempts";

        when(redisTemplate.hasKey(cooldownKey)).thenReturn(false);

        String otp = deliveryOtpService.generateOtp(orderId, partnerId);

        assertThat(otp).hasSize(6).containsPattern("\\d{6}");
        verify(valueOperations).set(eq(hashKey), anyString(), eq(900L), eq(TimeUnit.SECONDS));
        verify(redisTemplate).delete(attemptsKey);
        verify(valueOperations).set(eq(cooldownKey), eq("active"), eq(60L), eq(TimeUnit.SECONDS));
    }

    @Test
    void generateOtp_cooldownActive_throwsException() {
        Long orderId = 123L;
        Long partnerId = 456L;
        String cooldownKey = "delivery-otp:123:456:cooldown";

        when(redisTemplate.hasKey(cooldownKey)).thenReturn(true);

        assertThatThrownBy(() -> deliveryOtpService.generateOtp(orderId, partnerId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Resend cooldown active");
    }

    @Test
    void verifyOtp_correctOtp_returnsTrueAndClearsState() {
        Long orderId = 123L;
        Long partnerId = 456L;
        String code = "123456";
        String hashKey = "delivery-otp:123:456:hash";
        String attemptsKey = "delivery-otp:123:456:attempts";
        String cooldownKey = "delivery-otp:123:456:cooldown";

        String expectedHash = computeHash(orderId, partnerId, code, HASH_SECRET);
        when(valueOperations.get(hashKey)).thenReturn(expectedHash);
        when(valueOperations.increment(attemptsKey)).thenReturn(1L);

        boolean result = deliveryOtpService.verifyOtp(orderId, partnerId, code);

        assertThat(result).isTrue();
        verify(redisTemplate).delete(hashKey);
        verify(redisTemplate).delete(attemptsKey);
        verify(redisTemplate).delete(cooldownKey);
    }

    @Test
    void verifyOtp_wrongOtp_returnsFalse() {
        Long orderId = 123L;
        Long partnerId = 456L;
        String code = "123456";
        String wrongCode = "999999";
        String hashKey = "delivery-otp:123:456:hash";
        String attemptsKey = "delivery-otp:123:456:attempts";

        String expectedHash = computeHash(orderId, partnerId, code, HASH_SECRET);
        when(valueOperations.get(hashKey)).thenReturn(expectedHash);
        when(valueOperations.increment(attemptsKey)).thenReturn(1L);

        boolean result = deliveryOtpService.verifyOtp(orderId, partnerId, wrongCode);

        assertThat(result).isFalse();
        verify(redisTemplate, never()).delete(hashKey);
    }

    @Test
    void verifyOtp_tooManyAttempts_locksAndClearsState() {
        Long orderId = 123L;
        Long partnerId = 456L;
        String code = "123456";
        String hashKey = "delivery-otp:123:456:hash";
        String attemptsKey = "delivery-otp:123:456:attempts";

        when(valueOperations.increment(attemptsKey)).thenReturn(6L);

        assertThatThrownBy(() -> deliveryOtpService.verifyOtp(orderId, partnerId, code))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Verification locked");

        verify(redisTemplate).delete(hashKey);
    }

    private String computeHash(Long orderId, Long partnerId, String otp, String secret) {
        String data = orderId + ":" + partnerId + ":" + otp;
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : rawHmac) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException(e);
        }
    }
}
