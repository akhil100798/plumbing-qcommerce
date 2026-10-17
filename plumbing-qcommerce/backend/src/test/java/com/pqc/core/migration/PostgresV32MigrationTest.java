package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresV32MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String pass = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, pass);
        jdbc = new JdbcTemplate(dataSource);
        schema = "phase2_v32_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach void tearDown() {
        if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
    }

    @Test void migratesV1ThroughV32WithBaseScopedVersionsAndFrozenMaterialOwnership() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("32").load().migrate();

        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class))
                .isEqualTo("32");
        for (String index : new String[]{"uq_service_quote_non_addendum_version", "uq_service_quote_addendum_version",
                "uq_service_quote_addendum_current", "uq_quote_material_link_active"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname=?", Integer.class, schema, index))
                    .as(index).isEqualTo(1);
        }
        for (String constraint : new String[]{"ck_service_quote_addendum_base", "fk_service_quote_base_order",
                "fk_quote_material_link_quote_order", "fk_quote_material_link_request_order",
                 "fk_quote_material_link_item_request", "fk_quote_line_material_item_request",
                 "fk_quote_line_material_link"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname=?", Integer.class, schema, constraint))
                    .as(constraint).isEqualTo(1);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name='product_order_items' AND column_name='material_request_id'", Integer.class, schema)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name='service_quote_material_links' AND column_name='link_type'", Integer.class, schema)).isEqualTo(1);
    }
}
