package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresV31MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String pass = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, pass);
        jdbc = new JdbcTemplate(dataSource);
        schema = "phase2_v31_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach void tearDown() { if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE"); }

    @Test void migratesV1ThroughV31AndPreservesLegacyRowsWithoutInventingUnitsOrMaximums() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("30").load().migrate();
        Long legacyCatalogId = jdbc.queryForObject("INSERT INTO " + schema + ".service_pricing_catalog (catalog_key,currency,version,status,effective_from) VALUES ('LEGACY','INR',1,'ACTIVE',CURRENT_TIMESTAMP) RETURNING id", Long.class);
        Long legacyLineId = jdbc.queryForObject("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount) VALUES (?, 'LABOR','LABOR',123.45) RETURNING id", Long.class, legacyCatalogId);

        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("31").load().migrate();

        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("31");
        assertColumn("unit", "character varying", 32, null, true, null);
        assertColumn("min_quantity", "numeric", 10, 2, false, "1.00");
        assertColumn("max_quantity", "numeric", 10, 2, true, null);
        assertThat(jdbc.queryForObject("SELECT unit FROM " + schema + ".service_pricing_catalog_lines WHERE id=?", String.class, legacyLineId)).isNull();
        assertThat(jdbc.queryForObject("SELECT min_quantity FROM " + schema + ".service_pricing_catalog_lines WHERE id=?", BigDecimal.class, legacyLineId)).isEqualByComparingTo("1.00");
        assertThat(jdbc.queryForObject("SELECT max_quantity FROM " + schema + ".service_pricing_catalog_lines WHERE id=?", BigDecimal.class, legacyLineId)).isNull();

        Long validId = jdbc.queryForObject("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount,unit,min_quantity,max_quantity) VALUES (?, 'VALID','LABOR',10,'HOUR',0.50,4.00) RETURNING id", Long.class, legacyCatalogId);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM " + schema + ".service_pricing_catalog_lines WHERE id=?", Long.class, validId)).isEqualTo(1);
        assertConstraintRejects("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount,unit,min_quantity,max_quantity) VALUES (?, 'ZERO-MIN','LABOR',10,'HOUR',0,4)", legacyCatalogId);
        assertConstraintRejects("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount,unit,min_quantity,max_quantity) VALUES (?, 'BAD-RANGE','LABOR',10,'HOUR',2,1)", legacyCatalogId);
        assertConstraintRejects("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount,unit,min_quantity,max_quantity) VALUES (?, 'BLANK-UNIT','LABOR',10,'   ',1,4)", legacyCatalogId);
        assertConstraintRejects("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount,min_quantity,max_quantity) VALUES (?, 'NULL-UNIT','LABOR',10,1,4)", legacyCatalogId);
        assertConstraintRejects("INSERT INTO " + schema + ".service_pricing_catalog_lines (pricing_catalog_id,line_key,line_type,amount,unit,min_quantity) VALUES (?, 'NULL-MAX','LABOR',10,'HOUR',1)", legacyCatalogId);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname='uq_pricing_catalog_active'", Long.class, schema)).isEqualTo(1);
        for (String constraint : new String[]{"ck_pricing_catalog_line_unit", "ck_pricing_catalog_line_min_quantity", "ck_pricing_catalog_line_quantity_bounds", "ck_quote_line_totals"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname=?", Long.class, schema, constraint)).as(constraint).isEqualTo(1);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname IN ('uq_service_quote_one_revision','uq_service_quote_one_approved_repair')", Long.class, schema)).isEqualTo(2);
    }

    private void assertColumn(String name, String type, int precision, Integer scale, boolean nullable, String defaultValue) {
        var column = jdbc.queryForMap("SELECT data_type,character_maximum_length,numeric_precision,numeric_scale,is_nullable,column_default FROM information_schema.columns WHERE table_schema=? AND table_name='service_pricing_catalog_lines' AND column_name=?", schema, name);
        assertThat(column.get("data_type").toString()).isEqualTo(type);
        if ("character varying".equals(type)) assertThat(((Number) column.get("character_maximum_length")).intValue()).isEqualTo(precision);
        else assertThat(((Number) column.get("numeric_precision")).intValue()).isEqualTo(precision);
        if (scale != null) assertThat(((Number) column.get("numeric_scale")).intValue()).isEqualTo(scale);
        assertThat(column.get("is_nullable").toString()).isEqualTo(nullable ? "YES" : "NO");
        if (defaultValue != null) assertThat(column.get("column_default").toString()).contains(defaultValue);
    }

    private void assertConstraintRejects(String sql, Long catalogId) {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(sql, catalogId)).isInstanceOf(RuntimeException.class);
    }
}
