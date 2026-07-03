package com.pqc.core.service;

import com.pqc.core.config.OtpProperties;
import com.pqc.core.service.notification.SmsSender;
import com.pqc.core.service.otp.OtpStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    private OtpService otpService;

    @Mock private OtpStore otpStore;
    @Mock private SmsSender smsSender;
    @Mock private Environment env;

    private OtpProperties otpProperties;
    private static final String HASH_SECRET = "test-hash-secret-key-minimum-32-chars-long";

    @BeforeEach
    void setUp() {
        otpProperties = new OtpProperties();
        otpProperties.setLength(6);
        otpProperties.setExpirySeconds(300);
        otpProperties.setResendCooldownSeconds(60);
        otpProperties.setMaxVerifyAttempts(3); // 3 attempts for easy testing
        otpProperties.setDemoBypassEnabled(false);
        otpProperties.setDemoCode("");
        otpProperties.setHashSecret(HASH_SECRET);

        otpService = new OtpService(otpProperties, otpStore, smsSender, env);
    }

    @Test
    void sendOtp_successful_generatesAndSendsOtp() {
        String phone = "+91 9999999999";
        when(otpStore.checkLock(phone)).thenReturn(false);
        when(otpStore.acquireResendCooldown(eq(phone), eq(60L))).thenReturn(true);

        otpService.sendOtp(phone);

        verify(otpStore).saveOtpHash(eq(phone), anyString(), eq(300L));
        verify(smsSender).sendOtp(eq(phone), argThat(otp -> otp != null && otp.length() == 6));
    }

    @Test
    void sendOtp_lockedPhone_throwsForbidden() {
        String phone = "+91 9999999999";
        when(otpStore.checkLock(phone)).thenReturn(true);

        assertThatThrownBy(() -> otpService.sendOtp(phone))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                });

        verifyNoInteractions(smsSender);
    }

    @Test
    void sendOtp_cooldownActive_throwsTooManyRequests() {
        String phone = "+91 9999999999";
        when(otpStore.checkLock(phone)).thenReturn(false);
        when(otpStore.acquireResendCooldown(eq(phone), eq(60L))).thenReturn(false);

        assertThatThrownBy(() -> otpService.sendOtp(phone))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                });

        verifyNoInteractions(smsSender);
    }

    @Test
    void verifyOtp_correctOtp_returnsTrueAndClearsState() {
        String phone = "+91 9999999999";
        String code = "123456";
        String matchingHash = computeTestHash(phone, code, HASH_SECRET);

        when(otpStore.checkLock(phone)).thenReturn(false);
        when(otpStore.getOtpHash(phone)).thenReturn(matchingHash);

        boolean result = otpService.verifyOtp(phone, code);

        assertThat(result).isTrue();
        verify(otpStore).deleteOtpState(phone);
        verify(otpStore).deleteCooldownState(phone);
    }

    @Test
    void verifyOtp_wrongOtp_incrementsAttemptsAndThrowsUnauthorized() {
        String phone = "+91 9999999999";
        String correctCode = "123456";
        String inputCode = "654321";
        String correctHash = computeTestHash(phone, correctCode, HASH_SECRET);

        when(otpStore.checkLock(phone)).thenReturn(false);
        when(otpStore.getOtpHash(phone)).thenReturn(correctHash);
        when(otpStore.incrementVerifyAttempts(phone, 300L)).thenReturn(1L);

        assertThatThrownBy(() -> otpService.verifyOtp(phone, inputCode))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                });

        verify(otpStore).incrementVerifyAttempts(phone, 300L);
        verify(otpStore, never()).deleteOtpState(phone);
    }

    @Test
    void verifyOtp_wrongOtpExceedsMaxAttempts_locksPhoneAndThrowsForbidden() {
        String phone = "+91 9999999999";
        String correctCode = "123456";
        String inputCode = "654321";
        String correctHash = computeTestHash(phone, correctCode, HASH_SECRET);

        when(otpStore.checkLock(phone)).thenReturn(false);
        when(otpStore.getOtpHash(phone)).thenReturn(correctHash);
        // Returns 3 which meets max verify attempts (3)
        when(otpStore.incrementVerifyAttempts(phone, 300L)).thenReturn(3L);

        assertThatThrownBy(() -> otpService.verifyOtp(phone, inputCode))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("locked");
                });

        verify(otpStore).lockPhoneKey(phone, 3600);
        verify(otpStore).deleteOtpState(phone);
    }

    @Test
    void verifyOtp_static123456Bypass_notUnconditional_failsWhenDisabled() {
        String phone = "+91 9999999999";
        String code = "123456"; // Static bypass candidate

        when(otpStore.checkLock(phone)).thenReturn(false);
        when(otpStore.getOtpHash(phone)).thenReturn(null); // No active OTP saved

        // Should throw unauthorized and NOT bypass since bypass is disabled
        assertThatThrownBy(() -> otpService.verifyOtp(phone, code))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                });
    }

    @Test
    void verifyOtp_demoBypassEnabledInNonProd_succeedsForDemoCode() {
        String phone = "+91 9999999999";
        String demoCode = "123456";

        otpProperties.setDemoBypassEnabled(true);
        otpProperties.setDemoCode(demoCode);
        when(otpStore.checkLock(phone)).thenReturn(false);
        when(env.getActiveProfiles()).thenReturn(new String[]{"dev"});

        boolean result = otpService.verifyOtp(phone, demoCode);

        assertThat(result).isTrue();
        verify(otpStore).deleteOtpState(phone);
    }

    @Test
    void verifyOtp_demoBypassEnabledInProd_failsForDemoCode() {
        String phone = "+91 9999999999";
        String demoCode = "123456";

        otpProperties.setDemoBypassEnabled(true);
        otpProperties.setDemoCode(demoCode);
        when(otpStore.checkLock(phone)).thenReturn(false);
        // Active profile is prod
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        when(otpStore.getOtpHash(phone)).thenReturn(null);

        // Production profile must reject demo bypass and fallback to database check, throwing Unauthorized when hash is missing
        assertThatThrownBy(() -> otpService.verifyOtp(phone, demoCode))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                });
    }

    private String computeTestHash(String phone, String code, String secret) {
        String data = phone + ":" + code;
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
