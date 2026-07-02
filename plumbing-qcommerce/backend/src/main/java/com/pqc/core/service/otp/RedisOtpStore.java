package com.pqc.core.service.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisOtpStore implements OtpStore {

    private final StringRedisTemplate redisTemplate;

    private static final String KEY_HASH = "otp:%s:hash";
    private static final String KEY_ATTEMPTS = "otp:%s:attempts";
    private static final String KEY_COOLDOWN = "otp:%s:cooldown";
    private static final String KEY_LOCKED = "otp:%s:locked";

    @Override
    public boolean acquireResendCooldown(String phoneKey, long cooldownSeconds) {
        String key = String.format(KEY_COOLDOWN, phoneKey);
        // setIfAbsent behaves like SETNX. If key exists, it returns false (cooldown active).
        Boolean success = redisTemplate.opsForValue().setIfAbsent(key, "active", cooldownSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(success);
    }

    @Override
    public void saveOtpHash(String phoneKey, String hash, long expirySeconds) {
        String key = String.format(KEY_HASH, phoneKey);
        redisTemplate.opsForValue().set(key, hash, expirySeconds, TimeUnit.SECONDS);
        // Reset attempts count when a new OTP is successfully saved
        String attemptsKey = String.format(KEY_ATTEMPTS, phoneKey);
        redisTemplate.delete(attemptsKey);
    }

    @Override
    public String getOtpHash(String phoneKey) {
        String key = String.format(KEY_HASH, phoneKey);
        return redisTemplate.opsForValue().get(key);
    }

    @Override
    public long incrementVerifyAttempts(String phoneKey, long expirySeconds) {
        String key = String.format(KEY_ATTEMPTS, phoneKey);
        Long attempts = redisTemplate.opsForValue().increment(key);
        if (attempts != null && attempts == 1) {
            // Set TTL on the attempts key if it was just created
            redisTemplate.expire(key, expirySeconds, TimeUnit.SECONDS);
        }
        return attempts != null ? attempts : 0;
    }

    @Override
    public boolean checkLock(String phoneKey) {
        String key = String.format(KEY_LOCKED, phoneKey);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    @Override
    public void lockPhoneKey(String phoneKey, long lockoutSeconds) {
        String key = String.format(KEY_LOCKED, phoneKey);
        redisTemplate.opsForValue().set(key, "locked", lockoutSeconds, TimeUnit.SECONDS);
    }

    @Override
    public void deleteOtpState(String phoneKey) {
        redisTemplate.delete(String.format(KEY_HASH, phoneKey));
        redisTemplate.delete(String.format(KEY_ATTEMPTS, phoneKey));
    }

    @Override
    public void deleteCooldownState(String phoneKey) {
        redisTemplate.delete(String.format(KEY_COOLDOWN, phoneKey));
    }
}
