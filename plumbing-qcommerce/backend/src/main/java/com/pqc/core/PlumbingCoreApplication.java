package com.pqc.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SpringBootApplication
public class PlumbingCoreApplication {

	private static final Logger log = LoggerFactory.getLogger(PlumbingCoreApplication.class);

	public static class ProfileConflictSanitizer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
		@Override
		public void initialize(ConfigurableApplicationContext context) {
			ConfigurableEnvironment env = context.getEnvironment();
			String[] activeProfiles = env.getActiveProfiles();
			if (activeProfiles != null && activeProfiles.length > 0) {
				boolean hasProd = Arrays.stream(activeProfiles)
						.anyMatch(p -> p != null && p.trim().equalsIgnoreCase("prod"));
				boolean hasStaging = Arrays.stream(activeProfiles)
						.anyMatch(p -> p != null && (p.trim().equalsIgnoreCase("staging") || p.trim().equalsIgnoreCase("local-staging")));

				if (hasProd && hasStaging) {
					log.warn("DETECTED INCOMPATIBLE ACTIVE PROFILES: [prod, staging]. Resolving conflict: enforcing pure 'prod' profile for production deployment.");
					String[] sanitized = Arrays.stream(activeProfiles)
							.map(String::trim)
							.filter(p -> !p.equalsIgnoreCase("staging") && !p.equalsIgnoreCase("local-staging"))
							.toArray(String[]::new);
					env.setActiveProfiles(sanitized);

					// Ensure safe production overrides for staging-only properties
					Map<String, Object> overrides = new HashMap<>();
					overrides.put("spring.profiles.active", String.join(",", sanitized));
					overrides.put("app.seed.staging-admin-enabled", "false");
					overrides.put("app.seed.demo-enabled", "false");
					overrides.put("app.seed.catalog-enabled", "false");

					String smsProvider = env.getProperty("app.sms.provider", env.getProperty("SMS_PROVIDER", ""));
					if (smsProvider == null || "disabled".equalsIgnoreCase(smsProvider.trim()) || smsProvider.isBlank() || "none".equalsIgnoreCase(smsProvider.trim())) {
						overrides.put("app.sms.provider", "mock");
						overrides.put("SMS_PROVIDER", "mock");
					}
					env.getPropertySources().addFirst(new MapPropertySource("prodSanitizationOverrides", overrides));
				}
			}
		}
	}

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(PlumbingCoreApplication.class);
		app.addInitializers(new ProfileConflictSanitizer());
		app.run(args);
	}

}
