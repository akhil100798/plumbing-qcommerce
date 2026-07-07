package com.pqc.core.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@ConfigurationProperties(prefix = "app.sms")
@Data
@Slf4j
public class SmsProperties {
    public static final String PROVIDER_NONE = "none";
    public static final String PROVIDER_LOCAL_CAPTURE = "local-capture";
    public static final String PROVIDER_DISABLED = "disabled";

    private String provider = PROVIDER_NONE;
    private boolean localCaptureEnabled = false;
    private boolean failIfMissingProvider = true;

    @Autowired
    private Environment env;

    @PostConstruct
    public void validate() {
        String normalizedProvider = normalizedProvider();
        boolean isProd = hasProfile("prod");
        boolean isStaging = hasProfile("staging");
        boolean isLocalStaging = hasProfile("local-staging");

        if (isProd) {
            if (isStaging && PROVIDER_DISABLED.equals(normalizedProvider) && !localCaptureEnabled) {
                log.warn("SMS provider is disabled for staging; OTP/SMS delivery will not be sent externally.");
            } else {
                validateProductionProvider(normalizedProvider);
            }
        }

        if (!isStaging && PROVIDER_DISABLED.equals(normalizedProvider)) {
            throw new IllegalStateException("Production configuration violation: disabled SMS provider is only allowed with the staging profile.");
        }

        if (isLocalStaging && PROVIDER_LOCAL_CAPTURE.equals(normalizedProvider) && !localCaptureEnabled) {
            throw new IllegalStateException("Local staging configuration violation: app.sms.local-capture-enabled must be true for local-capture.");
        }
    }

    private void validateProductionProvider(String normalizedProvider) {
        if (normalizedProvider.isBlank() || PROVIDER_NONE.equals(normalizedProvider)) {
            throw new IllegalStateException("Production configuration violation: app.sms.provider must identify a real SMS provider.");
        }
        if (PROVIDER_DISABLED.equals(normalizedProvider)) {
            throw new IllegalStateException("Production configuration violation: disabled SMS provider is only allowed with the staging profile.");
        }
        if (PROVIDER_LOCAL_CAPTURE.equals(normalizedProvider) || localCaptureEnabled) {
            throw new IllegalStateException("Production configuration violation: local SMS capture is forbidden in production.");
        }
    }

    private String normalizedProvider() {
        return provider == null ? "" : provider.trim().toLowerCase();
    }

    private boolean hasProfile(String profile) {
        return env != null && env.getActiveProfiles() != null
                && Arrays.asList(env.getActiveProfiles()).contains(profile);
    }
}