package com.pqc.core.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProdProfileValidationTest {

    private MockEnvironment environment;
    private ProdProfileValidator validator;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        validator = new ProdProfileValidator(environment);
    }

    @Test
    void nonProdProfile_skipsValidation() {
        environment.setActiveProfiles("dev");
        ReflectionTestUtils.setField(validator, "databaseUrl", null);
        ReflectionTestUtils.setField(validator, "jwtSecret", null);

        assertThatCode(() -> validator.validateProdProfile())
                .doesNotThrowAnyException();
    }

    @Test
    void prodProfile_missingDatabaseUrl_throwsException() {
        environment.setActiveProfiles("prod");
        ReflectionTestUtils.setField(validator, "databaseUrl", "");
        ReflectionTestUtils.setField(validator, "jwtSecret", "a-very-strong-secure-production-jwt-secret-key-32-chars");

        assertThatThrownBy(() -> validator.validateProdProfile())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DATABASE_URL");
    }

    @Test
    void prodProfile_missingJwtSecret_throwsException() {
        environment.setActiveProfiles("prod");
        ReflectionTestUtils.setField(validator, "databaseUrl", "jdbc:postgresql://ep-silent-prod.render.com/pqc_prod");
        ReflectionTestUtils.setField(validator, "jwtSecret", "");

        assertThatThrownBy(() -> validator.validateProdProfile())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void prodProfile_defaultFallbackJwtSecret_throwsException() {
        environment.setActiveProfiles("prod");
        ReflectionTestUtils.setField(validator, "databaseUrl", "jdbc:postgresql://ep-silent-prod.render.com/pqc_prod");
        ReflectionTestUtils.setField(validator, "jwtSecret", ProdProfileValidator.FALLBACK_JWT_SECRET);

        assertThatThrownBy(() -> validator.validateProdProfile())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Default development JWT secret cannot be used in production");
    }

    @Test
    void prodProfile_shortJwtSecret_throwsException() {
        environment.setActiveProfiles("prod");
        ReflectionTestUtils.setField(validator, "databaseUrl", "jdbc:postgresql://ep-silent-prod.render.com/pqc_prod");
        ReflectionTestUtils.setField(validator, "jwtSecret", "short-key-under-32-chars");

        assertThatThrownBy(() -> validator.validateProdProfile())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 characters");
    }

    @Test
    void prodProfile_razorpayProviderWithoutCredentials_throwsException() {
        environment.setActiveProfiles("prod");
        ReflectionTestUtils.setField(validator, "databaseUrl", "jdbc:postgresql://ep-silent-prod.render.com/pqc_prod");
        ReflectionTestUtils.setField(validator, "jwtSecret", "a-very-strong-secure-production-jwt-secret-key-32-chars");
        ReflectionTestUtils.setField(validator, "paymentProvider", "razorpay");
        ReflectionTestUtils.setField(validator, "razorpayKeyId", null);

        assertThatThrownBy(() -> validator.validateProdProfile())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RAZORPAY_KEY_ID");
    }

    @Test
    void prodProfile_validConfiguration_passesValidation() {
        environment.setActiveProfiles("prod");
        ReflectionTestUtils.setField(validator, "databaseUrl", "jdbc:postgresql://ep-silent-prod.render.com/pqc_prod");
        ReflectionTestUtils.setField(validator, "jwtSecret", "a-very-strong-secure-production-jwt-secret-key-32-chars");
        ReflectionTestUtils.setField(validator, "paymentProvider", "razorpay");
        ReflectionTestUtils.setField(validator, "razorpayKeyId", "rzp_live_key_123");
        ReflectionTestUtils.setField(validator, "razorpayKeySecret", "rzp_live_secret_456");
        ReflectionTestUtils.setField(validator, "razorpayWebhookSecret", "rzp_webhook_secret_789");

        assertThatCode(() -> validator.validateProdProfile())
                .doesNotThrowAnyException();
    }
}
