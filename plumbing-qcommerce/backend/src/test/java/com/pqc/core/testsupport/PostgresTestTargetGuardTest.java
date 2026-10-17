package com.pqc.core.testsupport;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PostgresTestTargetGuardTest {
    private static final String USER = "qa_user";
    private static final String PASSWORD = "sensitive-test-secret";

    @Test
    void requiresExplicitUrlAndCredentials() {
        assertRedacted(() -> PostgresTestTargetGuard.parse(null, USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://127.0.0.1:5432/db", null, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://127.0.0.1:5432/db", USER, null));
    }

    @Test
    void rejectsProhibitedDatabaseAndMalformedUrls() {
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://127.0.0.1:5432/plumbing_commerce", USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("not-a-jdbc-url", USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://127.0.0.1/plumbing_commerce", USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://qa-db.internal:65536/fixkart_phase3_cert", USER, PASSWORD));
    }

    @Test
    void acceptsExplicitAlternatePortAndApprovedDatabaseWithoutConnecting() {
        var target = PostgresTestTargetGuard.parse("jdbc:postgresql://qa-db.internal:5544/fixkart_phase3_cert", USER, PASSWORD);
        assertEquals("qa-db.internal", target.host());
        assertEquals(5544, target.port());
        assertEquals("fixkart_phase3_cert", target.database());
        assertFalse(target.sanitizedDescription().contains(PASSWORD));
    }

    @Test
    void acceptsExplicitSslConnectionOptions() {
        var target = PostgresTestTargetGuard.parse(
                "jdbc:postgresql://qa-db.internal:5544/fixkart_phase3_cert?sslmode=require&connectTimeout=5",
                USER, PASSWORD);
        assertEquals(5544, target.port());
    }

    @Test
    void rejectsEmbeddedCredentialsAndDoesNotExposeSecrets() {
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://qa_user:sensitive-test-secret@qa-db.internal:5544/fixkart_phase3_cert", USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://qa-db.internal:5544/fixkart_phase3_cert?password=sensitive-test-secret", USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://qa-db.internal:5544/fixkart_phase3_cert?socketFactoryArg=other-host", USER, PASSWORD));
        assertRedacted(() -> PostgresTestTargetGuard.parse("jdbc:postgresql://qa-db.internal:5544/fixkart_phase3_cert?%68ost=other-host", USER, PASSWORD));
    }

    private void assertRedacted(Runnable action) {
        IllegalStateException error = assertThrows(IllegalStateException.class, action::run);
        assertFalse(error.getMessage().contains(PASSWORD));
        assertFalse(error.getMessage().contains(USER));
    }
}
