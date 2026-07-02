package com.pqc.core.service;

import com.pqc.core.config.OtpProperties;
import com.pqc.core.service.notification.SmsSender;
import com.pqc.core.service.otp.OtpStore;
import com.pqc.core.util.PhoneMaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpProperties otpProperties;
    private final OtpStore otpStore;
    private final SmsSender smsSender;
    private final Environment env;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Sends a secure OTP to the specified phone number after performing security and rate checks.
     */
    public void sendOtp(String phone) {
        // 1. Check if the phone number is locked
        if (otpStore.checkLock(phone)) {
            log.warn("[SECURITY] Blocked OTP send attempt for locked phone: {}", PhoneMaskingUtil.mask(phone));
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "This phone number is temporarily locked due to too many failed OTP attempts. Please try again later.");
        }

        // 2. Enforce resend cooldown
        boolean acquired = otpStore.acquireResendCooldown(phone, otpProperties.getResendCooldownSeconds());
        if (!acquired) {
            log.info("OTP request rate-limited for phone: {}", PhoneMaskingUtil.mask(phone));
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, 
                    "Please wait " + otpProperties.getResendCooldownSeconds() + " seconds between requests.");
        }

        // 3. Generate a cryptographically secure OTP
        String otp = generateSecureOtp(otpProperties.getLength());

        // 4. Hash the OTP using HMAC-SHA256, binding it to the phone number and secret
        String hash = hashOtp(phone, otp);

        // 5. Save the hashed OTP to the store with the configured expiry
        otpStore.saveOtpHash(phone, hash, otpProperties.getExpirySeconds());

        // 6. Transmit the OTP via the SMS abstraction (never log the OTP value!)
        log.info("OTP successfully generated and queued for phone: {}", PhoneMaskingUtil.mask(phone));
        smsSender.sendOtp(phone, otp);
    }

    /**
     * Verifies the OTP code for the given phone number, enforcing attempt limits and locking.
     */
    public boolean verifyOtp(String phone, String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP code is required.");
        }

        // 1. Check if the phone number is locked
        if (otpStore.checkLock(phone)) {
            log.warn("[SECURITY] Blocked OTP verification attempt for locked phone: {}", PhoneMaskingUtil.mask(phone));
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "This phone number is temporarily locked due to too many failed OTP attempts. Please try again later.");
        }

        // 2. Check for profile-safe demo bypass
        boolean isProd = env.getActiveProfiles() != null && Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (otpProperties.isDemoBypassEnabled() && !isProd && code.equals(otpProperties.getDemoCode())) {
            log.info("[SECURITY] Demo OTP bypass triggered for phone: {}", PhoneMaskingUtil.mask(phone));
            // Cleanup state on successful bypass verification to prevent replay
            otpStore.deleteOtpState(phone);
            otpStore.deleteCooldownState(phone);
            return true;
        }

        // 3. Retrieve stored hash
        String storedHash = otpStore.getOtpHash(phone);
        if (storedHash == null) {
            log.info("Failed verification: No active or unexpired OTP found for phone: {}", PhoneMaskingUtil.mask(phone));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired OTP");
        }

        // 4. Compute hash of the input OTP
        String inputHash = hashOtp(phone, code);

        // 5. Compare hashes
        if (storedHash.equals(inputHash)) {
            log.info("OTP verified successfully for phone: {}", PhoneMaskingUtil.mask(phone));
            // Consume the OTP: delete state to prevent replay attacks
            otpStore.deleteOtpState(phone);
            otpStore.deleteCooldownState(phone);
            return true;
        } else {
            // 6. OTP mismatch: Increment attempt counter
            long attempts = otpStore.incrementVerifyAttempts(phone, otpProperties.getExpirySeconds());
            log.warn("Incorrect OTP attempt #{} for phone: {}", attempts, PhoneMaskingUtil.mask(phone));

            if (attempts >= otpProperties.getMaxVerifyAttempts()) {
                // Lock the phone number for 1 hour (3600 seconds)
                otpStore.lockPhoneKey(phone, 3600);
                otpStore.deleteOtpState(phone); // Clear active OTP to prevent brute-forcing during lock
                log.warn("[SECURITY] Phone {} locked for 1 hour due to exceeding max OTP attempts.", PhoneMaskingUtil.mask(phone));
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                        "Too many incorrect attempts. This phone number has been locked for 1 hour.");
            }

            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired OTP");
        }
    }

    private String generateSecureOtp(int length) {
        if (length <= 0) {
            length = 6;
        }
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }

    private String hashOtp(String phone, String otp) {
        String data = phone + ":" + otp;
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    otpProperties.getHashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
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
            throw new IllegalStateException("HmacSHA256 calculation failed", e);
        }
    }
}
