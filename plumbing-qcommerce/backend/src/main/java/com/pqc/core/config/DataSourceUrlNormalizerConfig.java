package com.pqc.core.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Normalizes PostgreSQL JDBC URLs provided by cloud providers (such as Render).
 * Automatically converts "postgresql://" or "postgres://" to "jdbc:postgresql://".
 */
public class DataSourceUrlNormalizerConfig implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment environment = event.getEnvironment();
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = environment.getProperty("spring.datasource.url");
        }

        if (dbUrl != null && !dbUrl.isBlank()) {
            String normalizedUrl = normalizeUrl(dbUrl);
            if (!normalizedUrl.equals(dbUrl)) {
                Map<String, Object> properties = new HashMap<>();
                properties.put("spring.datasource.url", normalizedUrl);
                properties.put("DATABASE_URL", normalizedUrl);
                environment.getPropertySources().addFirst(new MapPropertySource("normalizedDatabaseUrl", properties));
            }
        }
    }

    private String normalizeUrl(String url) {
        String trimmed = url.trim();
        if (trimmed.startsWith("postgresql://")) {
            return "jdbc:" + trimmed;
        } else if (trimmed.startsWith("postgres://")) {
            return "jdbc:postgresql://" + trimmed.substring("postgres://".length());
        }
        return trimmed;
    }
}
