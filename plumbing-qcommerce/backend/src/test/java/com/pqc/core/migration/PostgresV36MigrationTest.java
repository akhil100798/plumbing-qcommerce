package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PostgresV36MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach
    void setUp() {
        dataSource = new DriverManagerDataSource(
                com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl(),
                com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername(),
                com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword());
        jdbc = new JdbcTemplate(dataSource);
        schema = "revoked_tokens_v36_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() {
        if (jdbc != null && schema != null) {
            jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        }
    }

    @Test
    void migratesFromV35ThroughV36AndCreatesRevokedTokensTable() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("35").load().migrate();

        assertThat(jdbc.queryForObject(
                "SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1",
                String.class)).isEqualTo("35");

        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("36").load().migrate();

        assertThat(jdbc.queryForObject(
                "SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1",
                String.class)).isEqualTo("36");

        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema=? AND table_name='revoked_tokens'",
                Integer.class, schema)).isEqualTo(1);

        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name='revoked_tokens'",
                Integer.class, schema)).isEqualTo(5);

        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE schemaname=? AND tablename='revoked_tokens' AND indexname='idx_revoked_tokens_expires_at'",
                Integer.class, schema)).isEqualTo(1);

        // Test FK relationship and ON DELETE CASCADE
        long userId = jdbc.queryForObject(
                "INSERT INTO " + schema + ".users(email,password,full_name,phone,role) VALUES ('v36-user@test','x','V36 User','9999999999','CUSTOMER') RETURNING id",
                Long.class);

        String jti = UUID.randomUUID().toString();
        Timestamp expiresAt = Timestamp.from(Instant.now().plusSeconds(3600));
        jdbc.update("INSERT INTO " + schema + ".revoked_tokens(jti, user_id, expires_at, reason) VALUES (?, ?, ?, ?)",
                jti, userId, expiresAt, "LOGOUT");

        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM " + schema + ".revoked_tokens WHERE jti = ?", Integer.class, jti)).isEqualTo(1);

        // Deleting user cascades to revoked_tokens
        jdbc.update("DELETE FROM " + schema + ".users WHERE id = ?", userId);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM " + schema + ".revoked_tokens WHERE jti = ?", Integer.class, jti)).isEqualTo(0);
    }
}
