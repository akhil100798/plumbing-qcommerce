package com.pqc.core.service.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * PostgreSQL-backed OTP state store. OTP state must remain durable and shared
 * across application instances; using the primary database avoids making
 * customer authentication depend on an optional Redis service.
 */
@Service
@RequiredArgsConstructor
public class DatabaseOtpStore implements OtpStore {

    private final JdbcTemplate jdbcTemplate;

    private void ensureRow(String phoneKey) {
        jdbcTemplate.update(
                "INSERT INTO otp_challenges (phone_key) VALUES (?) ON CONFLICT (phone_key) DO NOTHING",
                phoneKey
        );
    }

    @Override
    public boolean acquireResendCooldown(String phoneKey, long cooldownSeconds) {
        ensureRow(phoneKey);
        int updated = jdbcTemplate.update(
                "UPDATE otp_challenges " +
                        "SET cooldown_until = CURRENT_TIMESTAMP + (? * INTERVAL '1 second'), updated_at = CURRENT_TIMESTAMP " +
                        "WHERE phone_key = ? " +
                        "AND (cooldown_until IS NULL OR cooldown_until <= CURRENT_TIMESTAMP) " +
                        "AND (locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)",
                cooldownSeconds, phoneKey
        );
        return updated == 1;
    }

    @Override
    public void saveOtpHash(String phoneKey, String hash, long expirySeconds) {
        ensureRow(phoneKey);
        jdbcTemplate.update(
                "UPDATE otp_challenges SET otp_hash = ?, otp_expires_at = CURRENT_TIMESTAMP + (? * INTERVAL '1 second'), attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE phone_key = ?",
                hash, expirySeconds, phoneKey
        );
    }

    @Override
    public String getOtpHash(String phoneKey) {
        return jdbcTemplate.query(
                "SELECT otp_hash FROM otp_challenges WHERE phone_key = ? AND otp_hash IS NOT NULL AND otp_expires_at > CURRENT_TIMESTAMP",
                rs -> rs.next() ? rs.getString("otp_hash") : null,
                phoneKey
        );
    }

    @Override
    public long incrementVerifyAttempts(String phoneKey, long expirySeconds) {
        ensureRow(phoneKey);
        jdbcTemplate.update(
                "UPDATE otp_challenges SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE phone_key = ?",
                phoneKey
        );
        Long attempts = jdbcTemplate.queryForObject(
                "SELECT attempts FROM otp_challenges WHERE phone_key = ?",
                Long.class,
                phoneKey
        );
        return attempts == null ? 0 : attempts;
    }

    @Override
    public boolean checkLock(String phoneKey) {
        Integer active = jdbcTemplate.query(
                "SELECT 1 FROM otp_challenges WHERE phone_key = ? AND locked_until > CURRENT_TIMESTAMP",
                rs -> rs.next() ? rs.getInt(1) : null,
                phoneKey
        );
        return active != null;
    }

    @Override
    public void lockPhoneKey(String phoneKey, long lockoutSeconds) {
        ensureRow(phoneKey);
        jdbcTemplate.update(
                "UPDATE otp_challenges SET locked_until = CURRENT_TIMESTAMP + (? * INTERVAL '1 second'), updated_at = CURRENT_TIMESTAMP WHERE phone_key = ?",
                lockoutSeconds, phoneKey
        );
    }

    @Override
    public void deleteOtpState(String phoneKey) {
        jdbcTemplate.update(
                "UPDATE otp_challenges SET otp_hash = NULL, otp_expires_at = NULL, attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE phone_key = ?",
                phoneKey
        );
    }

    @Override
    public void deleteCooldownState(String phoneKey) {
        jdbcTemplate.update(
                "UPDATE otp_challenges SET cooldown_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE phone_key = ?",
                phoneKey
        );
    }
}
