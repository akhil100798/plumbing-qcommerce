package com.pqc.core.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Production & Staging DataSource configuration for PostgreSQL.
 * Parses cloud provider URLs (such as Render postgresql://user:pass@host/db)
 * into a clean HikariDataSource bean.
 */
@Configuration
@Profile("!test")
public class DataSourceConfig {

    @Value("${DATABASE_URL:${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5433/plumbing_commerce}}")
    private String rawUrl;

    @Value("${DATABASE_USERNAME:${SPRING_DATASOURCE_USERNAME:admin}}")
    private String rawUsername;

    @Value("${DATABASE_PASSWORD:${SPRING_DATASOURCE_PASSWORD:local-postgres-password}}")
    private String rawPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = rawUrl;
        String username = rawUsername;
        String password = rawPassword;

        if (url != null && !url.isBlank()) {
            String tempUrl = url.trim();
            if (tempUrl.startsWith("jdbc:")) {
                tempUrl = tempUrl.substring(5);
            }
            if (tempUrl.startsWith("postgresql://") || tempUrl.startsWith("postgres://")) {
                String prefix = tempUrl.startsWith("postgresql://") ? "postgresql://" : "postgres://";
                tempUrl = "http://" + tempUrl.substring(prefix.length());
                try {
                    URI uri = URI.create(tempUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    if (host != null && !host.isBlank()) {
                        url = "jdbc:postgresql://" + host + ":" + port + (path != null ? path : "");
                    }
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        username = parts[0];
                        password = parts[1];
                    }
                } catch (Exception ignored) {
                }
            }
        }

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setDriverClassName("org.postgresql.Driver");
        return ds;
    }
}
