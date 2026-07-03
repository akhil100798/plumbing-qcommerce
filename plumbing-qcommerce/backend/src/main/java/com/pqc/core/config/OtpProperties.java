package com.pqc.core.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@ConfigurationProperties(prefix = "app.otp")
@Data
public class OtpProperties {
    private int length = 6;
    private int expirySeconds = 300;
    private int resendCooldownSeconds = 60;
    private int maxVerifyAttempts = 5;
    private boolean demoBypassEnabled = false;
    private String demoCode = "";
    private String hashSecret = "";

    @Autowired
    private Environment env;

    @PostConstruct
    public void validate() {
        if (env != null && env.getActiveProfiles() != null) {
            boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("prod");
            if (isProd) {
                if (demoBypassEnabled) {
                    throw new IllegalStateException("Production configuration violation: app.otp.demo-bypass-enabled must be disabled in production.");
                }
                if (demoCode != null && !demoCode.isBlank()) {
                    throw new IllegalStateException("Production configuration violation: app.otp.demo-code must be blank/empty in production.");
                }
                if (hashSecret == null || hashSecret.isBlank()) {
                    throw new IllegalStateException("Production configuration violation: app.otp.hash-secret must not be blank in production.");
                }
                if ("local-development-only-change-me".equals(hashSecret)) {
                    throw new IllegalStateException("Production configuration violation: app.otp.hash-secret cannot use the default local development fallback value.");
                }
            }
        }
    }
}
