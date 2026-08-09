package com.pqc.core.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Normalizes PostgreSQL URLs provided by cloud providers (such as Render).
 * Extracts embedded credentials (user:pass@host/db) into standard Spring Boot
 * datasource properties: spring.datasource.url, username, and password.
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
            parseAndApply(environment, dbUrl.trim());
        }
    }

    private void parseAndApply(ConfigurableEnvironment environment, String dbUrl) {
        try {
            String tempUrl = dbUrl;
            if (tempUrl.startsWith("jdbc:")) {
                tempUrl = tempUrl.substring(5);
            }
            if (tempUrl.startsWith("postgresql://")) {
                tempUrl = "http://" + tempUrl.substring("postgresql://".length());
            } else if (tempUrl.startsWith("postgres://")) {
                tempUrl = "http://" + tempUrl.substring("postgres://".length());
            } else {
                return;
            }

            URI uri = URI.create(tempUrl);
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath();

            if (host == null || host.isBlank()) {
                return;
            }

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + (path != null ? path : "");
            Map<String, Object> properties = new HashMap<>();
            properties.put("spring.datasource.url", jdbcUrl);

            String userInfo = uri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                properties.put("spring.datasource.username", parts[0]);
                properties.put("spring.datasource.password", parts[1]);
                properties.put("DATABASE_USERNAME", parts[0]);
                properties.put("DATABASE_PASSWORD", parts[1]);
            }

            environment.getPropertySources().addFirst(new MapPropertySource("normalizedDatabaseUrl", properties));
        } catch (Exception ignored) {
        }
    }
}
