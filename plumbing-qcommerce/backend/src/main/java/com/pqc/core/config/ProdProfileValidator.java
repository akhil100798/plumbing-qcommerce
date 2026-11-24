package com.pqc.core.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Fail-fast startup configuration guard for the production profile.
 * Ensures the application refuses to start if critical security secrets,
 * database connectivity URLs, or payment credentials are missing or insecure.
 */
@Component
@Slf4j
public class ProdProfileValidator {

    public static final String FALLBACK_JWT_SECRET = "PlumbCommerceLocalSecretKeyFallbackForDeveloperModeOnlyChangeThisInProduction";

    private final Environment environment;

    @Value("${spring.datasource.url:${DATABASE_URL:}}")
    private String databaseUrl;

    @Value("${security.jwt.secret:${JWT_SECRET:}}")
    private String jwtSecret;

    @Value("${app.payment.provider:mock}")
    private String paymentProvider;

    @Value("${app.payment.razorpay.key-id:${RAZORPAY_KEY_ID:}}")
    private String razorpayKeyId;

    @Value("${app.payment.razorpay.key-secret:${RAZORPAY_KEY_SECRET:}}")
    private String razorpayKeySecret;

    @Value("${payment.razorpay.webhook-secret:${app.payment.razorpay.webhook-secret:${RAZORPAY_WEBHOOK_SECRET:}}}")
    private String razorpayWebhookSecret;

    public ProdProfileValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateProdProfile() {
        if (environment == null || !Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
            return;
        }

        log.info("[PROD-VALIDATOR] Validating production runtime fail-fast configuration guards...");

        // 1. Verify DATABASE_URL
        if (databaseUrl == null || databaseUrl.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: spring.datasource.url (DATABASE_URL) is missing or blank in production profile!");
        }

        // 2. Verify JWT_SECRET
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: security.jwt.secret (JWT_SECRET) is missing in production profile!");
        }
        if (jwtSecret.equals(FALLBACK_JWT_SECRET)) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: Default development JWT secret cannot be used in production profile!");
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: JWT_SECRET must be at least 32 characters in production profile!");
        }

        // 3. Verify Razorpay credentials if provider is razorpay
        if ("razorpay".equalsIgnoreCase(paymentProvider)) {
            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                throw new IllegalStateException("CRITICAL CONFIG ERROR: RAZORPAY_KEY_ID is missing for razorpay payment provider in production profile!");
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                throw new IllegalStateException("CRITICAL CONFIG ERROR: RAZORPAY_KEY_SECRET is missing for razorpay payment provider in production profile!");
            }
            if (razorpayWebhookSecret == null || razorpayWebhookSecret.isBlank()) {
                throw new IllegalStateException("CRITICAL CONFIG ERROR: RAZORPAY_WEBHOOK_SECRET is missing for razorpay payment provider in production profile!");
            }
        }

        log.info("[PROD-VALIDATOR] Production configuration validation PASSED.");
    }
}
