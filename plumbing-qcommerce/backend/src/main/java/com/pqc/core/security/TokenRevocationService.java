package com.pqc.core.security;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenRevocationService {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureTable() {
        try {
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS revoked_tokens (" +
                            "jti VARCHAR(64) PRIMARY KEY, " +
                            "user_id BIGINT, " +
                            "expires_at TIMESTAMP NOT NULL, " +
                            "revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                            "reason VARCHAR(255))"
            );
        } catch (Exception e) {
            log.debug("revoked_tokens table already initialized or managed by Flyway: {}", e.getMessage());
        }
    }

    /**
     * Revokes a JWT identifier durably in PostgreSQL.
     * Handles duplicate/concurrent logout attempts safely and idempotently via constraint violation translation.
     */
    @Transactional
    public void revokeToken(String jti, Long userId, Date expiresAt, String reason) {
        if (jti == null || jti.isBlank()) {
            return;
        }

        Timestamp expiryTimestamp = expiresAt != null
                ? new Timestamp(expiresAt.getTime())
                : new Timestamp(System.currentTimeMillis() + 86400000L);

        try {
            jdbcTemplate.update(
                    "INSERT INTO revoked_tokens (jti, user_id, expires_at, revoked_at, reason) " +
                            "VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)",
                    jti, userId, expiryTimestamp, reason
            );
            log.info("Token JTI [{}] successfully registered in PostgreSQL revocation store.", jti);
        } catch (DataIntegrityViolationException e) {
            log.info("Token JTI [{}] was already revoked (idempotent duplicate logout): {}", jti, e.getMessage());
        } catch (Exception e) {
            log.error("Failed to persist token revocation for JTI [{}]: {}", jti, e.getMessage());
            throw new IllegalStateException("Failed to record token revocation in database", e);
        }
    }

    /**
     * Authoritatively checks PostgreSQL whether a token JTI is revoked.
     * Fails closed by throwing a SecurityException if the database is unreachable or query fails.
     */
    @Transactional(readOnly = true)
    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }

        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM revoked_tokens WHERE jti = ? AND expires_at > CURRENT_TIMESTAMP",
                    Integer.class,
                    jti
            );
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Database query failed while checking token revocation for JTI [{}]: {}", jti, e.getMessage());
            throw new SecurityException("Token revocation check unavailable", e);
        }
    }

    /**
     * Purges expired revoked tokens. Tokens past their expiration cannot be valid regardless of revocation.
     */
    @Transactional
    public int purgeExpiredTokens() {
        try {
            int purged = jdbcTemplate.update("DELETE FROM revoked_tokens WHERE expires_at <= CURRENT_TIMESTAMP");
            if (purged > 0) {
                log.info("Purged {} expired revoked token records from PostgreSQL.", purged);
            }
            return purged;
        } catch (Exception e) {
            log.warn("Failed to purge expired revoked tokens: {}", e.getMessage());
            return 0;
        }
    }
}
