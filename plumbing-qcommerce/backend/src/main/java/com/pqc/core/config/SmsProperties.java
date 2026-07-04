package com.pqc.core.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@ConfigurationProperties(prefix = "app.sms")
@Data
public class SmsProperties {
    private String provider = "none";
    private boolean localCaptureEnabled = false;
    private boolean failIfMissingProvider = true;

    @Autowired
    private Environment env;

    @PostConstruct
    public void validate() {
        String normalizedProvider = provider == null ? "" : provider.trim().toLowerCase();
        boolean isProd = hasProfile("prod");
        boolean isLocalStaging = hasProfile("local-staging");

        if (isProd) {
            if (normalizedProvider.isBlank() || "none".equals(normalizedProvider)) {
                throw new IllegalStateException("Production configuration violation: app.sms.provider must identify a real SMS provider.");
            }
            if ("local-capture".equals(normalizedProvider) || localCaptureEnabled) {
                throw new IllegalStateException("Production configuration violation: local SMS capture is forbidden in production.");
            }
        }

        if (isLocalStaging && "local-capture".equals(normalizedProvider) && !localCaptureEnabled) {
            throw new IllegalStateException("Local staging configuration violation: app.sms.local-capture-enabled must be true for local-capture.");
        }
    }

    private boolean hasProfile(String profile) {
        return env != null && env.getActiveProfiles() != null
                && Arrays.asList(env.getActiveProfiles()).contains(profile);
    }
}
