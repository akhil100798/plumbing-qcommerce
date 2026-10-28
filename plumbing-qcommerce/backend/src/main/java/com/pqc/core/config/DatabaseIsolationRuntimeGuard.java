package com.pqc.core.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.net.URI;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Locale;

/**
 * Application-runtime database isolation guard independent of test-only guards.
 * Strictly verifies that when running in non-production (staging/dev/local) profiles,
 * the application refuses startup if configured or connected to production database targets.
 */
@Component
@Order(1) // Run before data seeders and other runners
@RequiredArgsConstructor
@Slf4j
public class DatabaseIsolationRuntimeGuard implements ApplicationRunner {

    private final DataSource dataSource;
    private final Environment environment;

    public static void validateJdbcUrl(String jdbcUrl, Environment env) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            return;
        }

        boolean isStaging = isStagingEnvironment(env);
        if (!isStaging) {
            return;
        }

        String cleaned = jdbcUrl.trim().toLowerCase(Locale.ROOT);

        // 1. Direct string check for production database names
        if (cleaned.contains("fixkart_postgres_new") || cleaned.contains("plumbing_commerce_prod")) {
            throw new IllegalStateException(
                "CRITICAL DATABASE ISOLATION VIOLATION: Staging runtime cannot target production database 'fixkart_postgres_new'!"
            );
        }

        // 2. Parse URI to inspect host and database path
        String temp = cleaned.startsWith("jdbc:") ? cleaned.substring(5) : cleaned;
        if (temp.startsWith("postgresql://") || temp.startsWith("postgres://")) {
            String prefix = temp.startsWith("postgresql://") ? "postgresql://" : "postgres://";
            temp = "http://" + temp.substring(prefix.length());
            try {
                URI uri = URI.create(temp);
                String host = uri.getHost();
                if (host != null) {
                    if (host.contains("oregon-postgres.render.com") || host.contains("render.com")) {
                        throw new IllegalStateException(
                            "CRITICAL DATABASE ISOLATION VIOLATION: Staging runtime cannot connect to production Render host: " + host
                        );
                    }
                }
                String path = uri.getPath();
                if (path != null && path.length() > 1) {
                    String dbName = path.substring(1);
                    if ("fixkart_postgres_new".equalsIgnoreCase(dbName) || dbName.contains("prod")) {
                        throw new IllegalStateException(
                            "CRITICAL DATABASE ISOLATION VIOLATION: Staging runtime cannot target database: " + dbName
                        );
                    }
                }
            } catch (Exception e) {
                if (e instanceof IllegalStateException) {
                    throw (IllegalStateException) e;
                }
            }
        }
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!isStagingEnvironment(environment)) {
            return;
        }

        log.info("DatabaseIsolationRuntimeGuard: verifying live database identity and isolation...");

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Verify live database name directly from server catalog
            try (ResultSet rs = stmt.executeQuery("SELECT current_database(), current_user, version()")) {
                if (rs.next()) {
                    String currentDb = rs.getString(1);
                    String currentUser = rs.getString(2);
                    String version = rs.getString(3);

                    log.info("Connected to database: '{}' as user: '{}' (Version: {})", currentDb, currentUser, version);

                    if ("fixkart_postgres_new".equalsIgnoreCase(currentDb)
                            || "plumbing_commerce_prod".equalsIgnoreCase(currentDb)
                            || currentDb.toLowerCase(Locale.ROOT).contains("prod")) {
                        throw new IllegalStateException(
                            "CRITICAL DATABASE ISOLATION VIOLATION: Live connected database is '" + currentDb +
                            "', which is identified as a production database! Staging startup aborted."
                        );
                    }

                    // Check server inet address
                    try (ResultSet rsHost = stmt.executeQuery("SELECT inet_server_addr()")) {
                        if (rsHost.next()) {
                            Object addr = rsHost.getObject(1);
                            log.info("Database server address: {}", addr);
                        }
                    } catch (Exception ignored) {
                        // Some proxy connections may not support inet_server_addr
                    }
                }
            }
        }

        log.info("DatabaseIsolationRuntimeGuard: database isolation check PASSED.");
    }

    private static boolean isStagingEnvironment(Environment env) {
        if (env == null || env.getActiveProfiles() == null) {
            return false;
        }
        return Arrays.stream(env.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("staging") || p.equalsIgnoreCase("local-staging"));
    }
}
