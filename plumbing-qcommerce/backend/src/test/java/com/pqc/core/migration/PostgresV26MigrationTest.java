package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresV26MigrationTest {
    private DriverManagerDataSource dataSource;
    private String schema;

    @BeforeEach
    void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String username = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String password = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, username, password);
        schema = "phase2_v26_" + UUID.randomUUID().toString().replace("-", "");
        new JdbcTemplate(dataSource).execute("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() {
        if (dataSource != null && schema != null) new JdbcTemplate(dataSource).execute("DROP SCHEMA " + schema + " CASCADE");
    }

    @Test
    void migratesThroughV26AndCreatesPhase2Contracts() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .baselineOnMigrate(false).target("26").locations("classpath:db/migration").load().migrate();
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success = TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("26");
        for (String table : new String[]{"phase2_enrollments", "service_diagnoses", "service_diagnosis_evidence", "service_quotes", "service_quote_lines", "service_pricing_catalog", "service_pricing_catalog_lines", "service_quote_events", "phase2_idempotency_keys", "service_quote_material_links", "phase2_reconciliations"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?", Integer.class, schema, table)).isEqualTo(1);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname = ? AND indexname = 'uq_phase2_enrollment_order'", Integer.class, schema)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname = ? AND indexname = 'uq_quote_event_transition'", Integer.class, schema)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname = ? AND indexname = 'uq_quote_event_idempotency'", Integer.class, schema)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname = ? AND indexname = 'uq_quote_material_link_active'", Integer.class, schema)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint WHERE connamespace = ?::regnamespace AND conname = 'service_order_photos_phase_check'", Integer.class, schema)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM " + schema + ".phase2_enrollments", Integer.class)).isZero();
    }
}
