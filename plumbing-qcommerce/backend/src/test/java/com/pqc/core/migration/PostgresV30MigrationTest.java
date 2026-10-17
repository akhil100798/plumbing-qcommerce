package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresV30MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String pass = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, pass);
        jdbc = new JdbcTemplate(dataSource);
        schema = "phase2_v30_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach void tearDown() { if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE"); }

    @Test void alignsQuoteCatalogVersionTypeAndEnforcesCurrentRepairQuoteRules() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("30").load().migrate();
        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("30");
        assertThat(jdbc.queryForObject("SELECT data_type FROM information_schema.columns WHERE table_schema=? AND table_name='service_quotes' AND column_name='pricing_catalog_version'", String.class, schema)).isEqualTo("integer");
        for (String index : new String[]{"uq_service_quote_one_revision", "uq_service_quote_one_approved_repair"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname=?", Integer.class, schema, index)).isEqualTo(1);
        }
        for (String constraint : new String[]{"ck_service_quote_published_expiry", "ck_quote_line_totals"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname=?", Integer.class, schema, constraint)).isEqualTo(1);
        }
    }
}
