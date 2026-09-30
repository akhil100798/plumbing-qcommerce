package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PostgreSQL-specific migration verification for V25.
 *
 * V25 deliberately uses a PostgreSQL partial unique index. H2 is not a
 * production-equivalent substitute for this migration and is only used by
 * legacy migration tests targeted below V25.
 */
class PostgresV25MigrationTest {
    private DriverManagerDataSource dataSource;
    private String schema;

    @BeforeEach
    void setUp() {
        String url = System.getenv().getOrDefault("PHASE1_TEST_POSTGRES_URL", "jdbc:postgresql://localhost:5433/plumbing_commerce");
        String username = System.getenv().getOrDefault("PHASE1_TEST_POSTGRES_USERNAME", "admin");
        String password = System.getenv().getOrDefault("PHASE1_TEST_POSTGRES_PASSWORD", "local-postgres-password");
        dataSource = new DriverManagerDataSource(url, username, password);
        schema = "phase1_v25_" + UUID.randomUUID().toString().replace("-", "");
        new JdbcTemplate(dataSource).execute("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() {
        if (dataSource != null && schema != null) {
            new JdbcTemplate(dataSource).execute("DROP SCHEMA " + schema + " CASCADE");
        }
    }

    @Test
    void migratesThroughV25AndCreatesPostgresPartialUniqueAssignmentIndex() {
        Flyway.configure()
                .dataSource(dataSource)
                .schemas(schema)
                .defaultSchema(schema)
                .baselineOnMigrate(false)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        assertThat(jdbc.queryForObject(
                "SELECT version FROM " + schema + ".flyway_schema_history WHERE success = TRUE ORDER BY installed_rank DESC LIMIT 1",
                String.class)).isEqualTo("25");
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = 'service_order_assignments'",
                Integer.class, schema)).isEqualTo(1);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE schemaname = ? AND indexname = 'uq_current_service_order_assignment' AND indexdef LIKE '%WHERE%ASSIGNED%'",
                Integer.class, schema)).isEqualTo(1);
    }
}
