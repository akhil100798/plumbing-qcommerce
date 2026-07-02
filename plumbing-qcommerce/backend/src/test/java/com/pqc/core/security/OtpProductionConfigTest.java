package com.pqc.core.security;

import com.pqc.core.config.OtpProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpProductionConfigTest {

    @Mock private Environment env;
    private OtpProperties properties;

    @BeforeEach
    void setUp() {
        properties = new OtpProperties();
        properties.setEnv(env);
    }

    @Test
    void validate_prodProfileSafeConfig_doesNotThrow() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        
        properties.setDemoBypassEnabled(false);
        properties.setDemoCode("");
        properties.setHashSecret("a-very-strong-and-secure-hash-secret-value");

        assertThatCode(() -> properties.validate()).doesNotThrowAnyException();
    }

    @Test
    void validate_prodProfileBypassEnabled_throwsIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        
        properties.setDemoBypassEnabled(true); // Violation
        properties.setDemoCode("");
        properties.setHashSecret("a-very-strong-and-secure-hash-secret-value");

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("demo-bypass-enabled must be disabled");
    }

    @Test
    void validate_prodProfileDemoCodeNotEmpty_throwsIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        
        properties.setDemoBypassEnabled(false);
        properties.setDemoCode("123456"); // Violation
        properties.setHashSecret("a-very-strong-and-secure-hash-secret-value");

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("demo-code must be blank");
    }

    @Test
    void validate_prodProfileSecretBlank_throwsIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        
        properties.setDemoBypassEnabled(false);
        properties.setDemoCode("");
        properties.setHashSecret(""); // Violation

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("hash-secret must not be blank");
    }

    @Test
    void validate_prodProfileSecretDefaultFallback_throwsIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        
        properties.setDemoBypassEnabled(false);
        properties.setDemoCode("");
        properties.setHashSecret("local-development-only-change-me"); // Violation (default fallback)

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot use the default local development fallback value");
    }

    @Test
    void validate_nonProdProfileUnsafeConfig_doesNotThrow() {
        // Active profiles is not prod
        when(env.getActiveProfiles()).thenReturn(new String[]{"dev", "local"});
        
        properties.setDemoBypassEnabled(true);
        properties.setDemoCode("123456");
        properties.setHashSecret(""); // Blank secret allowed in local dev

        assertThatCode(() -> properties.validate()).doesNotThrowAnyException();
    }
}
