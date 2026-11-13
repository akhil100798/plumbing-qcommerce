package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresV29MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach
    void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String password = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, password);
        jdbc = new JdbcTemplate(dataSource);
        schema = "phase2_v29_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() {
        if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
    }

    @Test
    void migratesV1ThroughV29AndAddsQuoteLifecycleColumnsAndGuards() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("29").load().migrate();

        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("29");
        assertColumns("service_quotes", "labor_subtotal", "known_material_subtotal", "pricing_catalog_version", "published_at", "approved_at", "rejected_at", "decision_actor_id", "decision_reason", "expires_at", "supersedes_quote_id", "immutable_snapshot_at");
        assertColumns("service_quote_lines", "quantity", "unit", "unit_price", "line_total", "pricing_source_version");

        assertIndex("uq_service_quote_current_published");
        assertThat(jdbc.queryForObject("SELECT indexdef FROM pg_indexes WHERE schemaname=? AND indexname='uq_service_quote_current_published'", String.class, schema))
                .contains("UNIQUE").contains("PUBLISHED").contains("INITIAL").contains("REVISION");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND t.relname='service_quote_lines' AND c.conname='ck_quote_line_quantity'", Integer.class, schema)).isEqualTo(1);
    }

    private void assertColumns(String table, String... columns) {
        for (String column : columns) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?", Integer.class, schema, table, column))
                    .as(table + "." + column).isEqualTo(1);
        }
    }

    private void assertIndex(String index) {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname=?", Integer.class, schema, index))
                .as(index).isEqualTo(1);
    }
}
