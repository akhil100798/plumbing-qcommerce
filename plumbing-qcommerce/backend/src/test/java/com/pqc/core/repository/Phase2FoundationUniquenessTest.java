package com.pqc.core.repository;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class Phase2FoundationUniquenessTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String password = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, password);
        schema = "phase2_unique_" + UUID.randomUUID().toString().replace("-", "");
        new JdbcTemplate(dataSource).execute("CREATE SCHEMA " + schema);
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("33").load().migrate();
        jdbc = new JdbcTemplate(dataSource);
    }

    @AfterEach void tearDown() { new JdbcTemplate(dataSource).execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE"); }

    @Test void phase2UniquenessContractsExistThroughV33() {
        assertThat(index("uq_phase2_enrollment_order")).isTrue();
        assertThat(constraint("uq_phase2_idempotency")).isTrue();
        assertThat(index("uq_quote_event_transition")).isTrue();
        assertThat(index("uq_quote_event_idempotency")).isTrue();
        assertThat(index("uq_quote_material_link_active")).isTrue();
        assertThat(index("uq_live_phase2_reconciliation")).isTrue();
    }

    private boolean index(String name) { return jdbc.queryForObject("select count(*) from pg_indexes where schemaname = ? and indexname = ?", Integer.class, schema, name) == 1; }
    private boolean constraint(String name) { return jdbc.queryForObject("select count(*) from pg_constraint where connamespace = ?::regnamespace and conname = ?", Integer.class, schema, name) == 1; }
}
