package com.pqc.core.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@ConfigurationProperties(prefix = "app.delivery-otp")
@Data
public class DeliveryOtpProperties {
    private int length = 6;
    private int expirySeconds = 900;
    private int cooldownSeconds = 60;
    private int maxAttempts = 5;
    private String hashSecret = "";

    @Autowired
    private Environment env;

    @PostConstruct
    public void validate() {
        if (env != null && env.getActiveProfiles() != null) {
            boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("prod");
            if (isProd) {
                if (hashSecret == null || hashSecret.isBlank()) {
                    throw new IllegalStateException("Production configuration violation: app.delivery-otp.hash-secret must not be blank in production.");
                }
                if ("local-development-only-change-me".equals(hashSecret)) {
                    throw new IllegalStateException("Production configuration violation: app.delivery-otp.hash-secret cannot use the default local development fallback value.");
                }
            }
        }
    }
}
