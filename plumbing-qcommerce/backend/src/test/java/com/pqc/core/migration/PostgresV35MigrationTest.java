package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PostgresV35MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        dataSource = new DriverManagerDataSource(
                com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl(),
                com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername(),
                com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword());
        jdbc = new JdbcTemplate(dataSource);
        schema = "launch_roster_v35_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach void tearDown() {
        if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
    }

    @Test void migratesFromV34AndCreatesAppendOnlyRosterAuditHistory() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("34").load().migrate();

        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("34");

        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("35").load().migrate();

        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("35");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name='launch_roster_audit_history'", Integer.class, schema)).isEqualTo(7);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=? AND c.relname='launch_roster_audit_history' AND t.tgname IN ('trg_launch_roster_audit_history_immutable','trg_launch_roster_audit_history_no_truncate') AND NOT t.tgisinternal", Integer.class, schema)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname IN ('idx_launch_roster_audit_policy_created','idx_launch_roster_audit_plumber_created')", Integer.class, schema)).isEqualTo(2);

        long admin = jdbc.queryForObject("INSERT INTO " + schema + ".users(email,password,full_name,phone,role) VALUES ('audit-admin@test','x','Admin','1','ADMIN') RETURNING id", Long.class);
        long plumber = jdbc.queryForObject("INSERT INTO " + schema + ".users(email,password,full_name,phone,role) VALUES ('audit-plumber@test','x','Plumber','2','PLUMBER') RETURNING id", Long.class);
        long policy = jdbc.queryForObject("INSERT INTO " + schema + ".launch_policies(policy_key,currency) VALUES ('SERVICE_LAUNCH','INR') RETURNING id", Long.class);
        long roster = jdbc.queryForObject("INSERT INTO " + schema + ".launch_plumber_roster(policy_id,plumber_id,approved) VALUES (?,?,FALSE) RETURNING id", Long.class, policy, plumber);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO " + schema + ".launch_plumber_roster(policy_id,plumber_id,approved) VALUES (?,?,TRUE)", policy, plumber)).isInstanceOf(Exception.class);
        assertThat(jdbc.queryForObject("SELECT approved FROM " + schema + ".launch_plumber_roster WHERE id=?", Boolean.class, roster)).isFalse();
        jdbc.update("UPDATE " + schema + ".launch_plumber_roster SET approved=TRUE WHERE id=?", roster);
        assertThat(jdbc.queryForObject("SELECT approved FROM " + schema + ".launch_plumber_roster WHERE id=?", Boolean.class, roster)).isTrue();
        long event = jdbc.queryForObject("INSERT INTO " + schema + ".launch_roster_audit_history(policy_id,plumber_id,actor_user_id,action,reason) VALUES (?,?,?,'ACTIVATED','verified') RETURNING id", Long.class, policy, plumber, admin);
        assertThatThrownBy(() -> jdbc.update("UPDATE " + schema + ".launch_roster_audit_history SET reason='changed' WHERE id=?", event)).isInstanceOf(Exception.class);
        assertThatThrownBy(() -> jdbc.update("DELETE FROM " + schema + ".launch_roster_audit_history WHERE id=?", event)).isInstanceOf(Exception.class);
        assertThatThrownBy(() -> jdbc.execute("TRUNCATE TABLE " + schema + ".launch_roster_audit_history")).isInstanceOf(Exception.class);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM " + schema + ".launch_roster_audit_history", Integer.class)).isEqualTo(1);
    }
}
