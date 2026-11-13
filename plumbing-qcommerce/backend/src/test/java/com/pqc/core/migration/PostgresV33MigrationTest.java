package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresV33MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String pass = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, pass);
        jdbc = new JdbcTemplate(dataSource);
        schema = "phase2_v33_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach void tearDown() {
        if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
    }

    @Test void migratesThroughV33AndEnforcesOneLiveAttemptAndTerminalTimestamp() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("33").load().migrate();

        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class))
                .isEqualTo("33");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname='uq_live_phase2_reconciliation'", Integer.class, schema))
                .isEqualTo(1);
        String liveIndex = jdbc.queryForObject("SELECT indexdef FROM pg_indexes WHERE schemaname=? AND indexname='uq_live_phase2_reconciliation'", String.class, schema);
        assertThat(liveIndex).contains("service_order_id").contains("OPEN").contains("AWAITING_CUSTOMER_APPROVAL");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname='ck_reconciliation_terminal_timestamp'", Integer.class, schema))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname='ck_reconciliation_correction_ref_strict'", Integer.class, schema))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname='ck_reconciliation_terminal_type'", Integer.class, schema))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname='ck_reconciliation_variance_status'", Integer.class, schema))
                .isEqualTo(1);
        String terminalCheck = jdbc.queryForObject("SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname='ck_reconciliation_terminal_timestamp'", String.class, schema);
        assertThat(terminalCheck).contains("resolved_at IS NOT NULL").contains("CLOSED_CANCELLED").contains("RESOLVED");
    }
}
