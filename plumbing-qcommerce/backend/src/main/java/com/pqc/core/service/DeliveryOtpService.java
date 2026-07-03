package com.pqc.core.service;

import com.pqc.core.config.DeliveryOtpProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryOtpService {

    private final StringRedisTemplate redisTemplate;
    private final DeliveryOtpProperties deliveryOtpProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String KEY_HASH = "delivery-otp:%s:%s:hash";
    private static final String KEY_ATTEMPTS = "delivery-otp:%s:%s:attempts";
    private static final String KEY_COOLDOWN = "delivery-otp:%s:%s:cooldown";

    /**
     * Generates a cryptographically secure OTP, hashes it, and stores it in Redis.
     */
    public String generateOtp(Long orderId, Long deliveryPartnerId) {
        String cooldownKey = String.format(KEY_COOLDOWN, orderId, deliveryPartnerId);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            log.warn("Resend cooldown active for order {}, delivery partner {}", orderId, deliveryPartnerId);
            throw new IllegalStateException("Resend cooldown active. Please wait.");
        }

        // 1. Generate secure OTP with configured length
        int length = deliveryOtpProperties.getLength();
        if (length <= 0) {
            length = 6;
        }
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        String otp = sb.toString();

        // 2. Hash the OTP with context (orderId, deliveryPartnerId)
        String hash = hashOtp(orderId, deliveryPartnerId, otp);

        // 3. Save hash to Redis with configured expiry
        String hashKey = String.format(KEY_HASH, orderId, deliveryPartnerId);
        redisTemplate.opsForValue().set(hashKey, hash, deliveryOtpProperties.getExpirySeconds(), TimeUnit.SECONDS);

        // 4. Reset attempts count
        String attemptsKey = String.format(KEY_ATTEMPTS, orderId, deliveryPartnerId);
        redisTemplate.delete(attemptsKey);

        // 5. Set resend cooldown
        redisTemplate.opsForValue().set(cooldownKey, "active", deliveryOtpProperties.getCooldownSeconds(), TimeUnit.SECONDS);

        return otp;
    }

    /**
     * Allows storing an explicit OTP (e.g. for testing or predefined flows), hashing it securely.
     */
    public void saveExplicitOtp(Long orderId, Long deliveryPartnerId, String otp) {
        String hash = hashOtp(orderId, deliveryPartnerId, otp);
        String hashKey = String.format(KEY_HASH, orderId, deliveryPartnerId);
        redisTemplate.opsForValue().set(hashKey, hash, deliveryOtpProperties.getExpirySeconds(), TimeUnit.SECONDS);

        String attemptsKey = String.format(KEY_ATTEMPTS, orderId, deliveryPartnerId);
        redisTemplate.delete(attemptsKey);
    }

    /**
     * Verifies the OTP, enforcing attempt limits (max 5) and replay protection.
     */
    public boolean verifyOtp(Long orderId, Long deliveryPartnerId, String code) {
        if (code == null || code.isBlank()) {
            return false;
        }

        String hashKey = String.format(KEY_HASH, orderId, deliveryPartnerId);
        String attemptsKey = String.format(KEY_ATTEMPTS, orderId, deliveryPartnerId);

        // 1. Increment attempts counter
        Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(attemptsKey, deliveryOtpProperties.getExpirySeconds(), TimeUnit.SECONDS);
        }

        if (attempts != null && attempts > deliveryOtpProperties.getMaxAttempts()) {
            redisTemplate.delete(hashKey); // Delete hash to lock verification
            log.warn("[SECURITY] Too many delivery OTP attempts. Locked order {}, delivery partner {}", orderId, deliveryPartnerId);
            throw new IllegalArgumentException("Verification locked due to too many failed attempts.");
        }

        String storedHash = redisTemplate.opsForValue().get(hashKey);
        if (storedHash == null) {
            return false;
        }

        // 2. Hash input and verify
        String inputHash = hashOtp(orderId, deliveryPartnerId, code);
        if (storedHash.equals(inputHash)) {
            // Replay protection: delete OTP state upon success
            redisTemplate.delete(hashKey);
            redisTemplate.delete(attemptsKey);
            redisTemplate.delete(String.format(KEY_COOLDOWN, orderId, deliveryPartnerId));
            return true;
        }

        return false;
    }

    private String hashOtp(Long orderId, Long deliveryPartnerId, String otp) {
        String data = orderId + ":" + deliveryPartnerId + ":" + otp;
        try {
            String secret = deliveryOtpProperties.getHashSecret();
            if (secret == null || secret.isBlank()) {
                secret = "local-development-only-change-me";
            }
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
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
