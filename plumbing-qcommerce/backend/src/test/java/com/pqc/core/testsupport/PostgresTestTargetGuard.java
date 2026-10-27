package com.pqc.core.testsupport;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/** Fail-closed, connection-free configuration check shared by direct PostgreSQL tests. */
public final class PostgresTestTargetGuard {
    private PostgresTestTargetGuard() {}

    public static Target requireTarget() {
        Target target = validate(System.getenv("PHASE1_TEST_POSTGRES_URL"),
                System.getenv("PHASE1_TEST_POSTGRES_USERNAME"),
                System.getenv("PHASE1_TEST_POSTGRES_PASSWORD"));
        requireOptionalMatch("PHASE1_TEST_POSTGRES_EXPECTED_HOST", System.getenv("PHASE1_TEST_POSTGRES_EXPECTED_HOST"), target.host());
        requireOptionalMatch("PHASE1_TEST_POSTGRES_EXPECTED_PORT", System.getenv("PHASE1_TEST_POSTGRES_EXPECTED_PORT"), Integer.toString(target.port()));
        requireOptionalMatch("PHASE1_TEST_POSTGRES_EXPECTED_DATABASE", System.getenv("PHASE1_TEST_POSTGRES_EXPECTED_DATABASE"), target.database());
        return target;
    }

    public static String requireUrl() {
        requireTarget();
        return System.getenv("PHASE1_TEST_POSTGRES_URL").trim();
    }

    public static String requireUsername() {
        requireTarget();
        return System.getenv("PHASE1_TEST_POSTGRES_USERNAME").trim();
    }

    public static String requirePassword() {
        requireTarget();
        return System.getenv("PHASE1_TEST_POSTGRES_PASSWORD");
    }

    static Target parse(String rawUrl, String username, String password) {
        return validate(rawUrl, username, password);
    }

    private static Target validate(String rawUrl, String username, String password) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalStateException("PHASE1_TEST_POSTGRES_URL is required; PostgreSQL tests will not connect");
        }
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalStateException("PHASE1_TEST_POSTGRES_USERNAME and PHASE1_TEST_POSTGRES_PASSWORD are required; PostgreSQL tests will not connect");
        }
        String value = rawUrl.trim();
        if (!value.startsWith("jdbc:")) {
            throw new IllegalStateException("PHASE1_TEST_POSTGRES_URL must be an explicit JDBC PostgreSQL URL");
        }
        final URI uri;
        try {
            uri = new URI(value.substring("jdbc:".length()));
        } catch (URISyntaxException | IllegalArgumentException e) {
            throw new IllegalStateException("PHASE1_TEST_POSTGRES_URL is malformed");
        }
        if (!"postgresql".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                || uri.getPort() < 1 || uri.getPort() > 65535 || uri.getRawUserInfo() != null
                || uri.getRawPath() == null || uri.getRawPath().length() < 2
                || uri.getRawPath().substring(1).contains("/")
                || uri.getRawPath().substring(1).contains("%")) {
            throw new IllegalStateException("PHASE1_TEST_POSTGRES_URL must contain explicit host, port, and database without embedded credentials");
        }
        String host = uri.getHost().toLowerCase(java.util.Locale.ROOT);
        if (host.endsWith("render.com") || host.endsWith("supabase.co") || host.contains("amazonaws.com")) {
            throw new IllegalStateException("PostgreSQL tests may not target cloud-hosted environments (*.render.com, *.supabase.co, *.amazonaws.com)");
        }
        if (uri.getRawFragment() != null || hasUnsafeQueryParameter(uri.getRawQuery())) {
            throw new IllegalStateException("PHASE1_TEST_POSTGRES_URL contains an unsafe connection override");
        }
        String database = uri.getRawPath().substring(1);
        if (!database.matches("[A-Za-z0-9_]+")
                || "plumbing_commerce".equalsIgnoreCase(database)
                || "fixkart_postgres_new".equalsIgnoreCase(database)
                || database.toLowerCase().contains("prod")) {
            throw new IllegalStateException("PostgreSQL tests may not target production databases (plumbing_commerce, fixkart_postgres_new, or *prod*)");
        }
        return new Target(value, host, uri.getPort(), database);
    }

    private static void requireOptionalMatch(String name, String expected, String actual) {
        if (expected != null && !expected.isBlank() && !expected.trim().equalsIgnoreCase(actual)) {
            throw new IllegalStateException("PostgreSQL test target does not match " + name);
        }
    }

    private static boolean hasUnsafeQueryParameter(String query) {
        if (query == null) return false;
        for (String parameter : query.split("&")) {
            final String name;
            try {
                name = URLDecoder.decode(parameter.split("=", 2)[0], StandardCharsets.UTF_8);
            } catch (IllegalArgumentException e) {
                return true;
            }
            if (!java.util.Set.of("ssl", "sslmode", "sslcert", "sslkey", "sslrootcert",
                    "applicationname", "connecttimeout", "sockettimeout", "tcpkeepalive")
                    .contains(name.toLowerCase(java.util.Locale.ROOT))) return true;
        }
        return false;
    }

    public record Target(String jdbcUrl, String host, int port, String database) {
        public String sanitizedDescription() {
            return host + ":" + port + " database " + database;
        }
    }
}
