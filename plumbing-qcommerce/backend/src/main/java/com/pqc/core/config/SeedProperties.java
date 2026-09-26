package com.pqc.core.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@ConfigurationProperties(prefix = "app.seed")
@Data
public class SeedProperties {
    private boolean demoEnabled = false;
    private boolean catalogEnabled = false;
    private boolean adminDemoEnabled = false;
    private boolean failIfProdDemoEnabled = true;
    private String demoPassword = "password";

    @Autowired
    private Environment env;

    @PostConstruct
    public void validate() {
        if (env != null && env.getActiveProfiles() != null) {
            boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("prod");
            if (isProd) {
                if (failIfProdDemoEnabled && (demoEnabled || adminDemoEnabled || catalogEnabled)) {
                    throw new IllegalStateException("Production configuration violation: Seeding cannot be enabled when the production profile is active.");
                }
                if (demoEnabled || adminDemoEnabled || catalogEnabled) {
                    if (demoPassword == null || demoPassword.isBlank()) {
                        throw new IllegalStateException("Production configuration violation: app.seed.demo-password must not be blank when seeding is enabled.");
                    }
                    String lowerPwd = demoPassword.toLowerCase().trim();
                    if (lowerPwd.equals("password") || lowerPwd.equals("admin") || lowerPwd.equals("123456")) {
                        throw new IllegalStateException("Production configuration violation: app.seed.demo-password cannot use a weak default password.");
                    }
                }
            }
        }
    }
}
