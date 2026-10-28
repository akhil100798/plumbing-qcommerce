package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PostgresV34MigrationTest {
    private DriverManagerDataSource dataSource;
    private JdbcTemplate jdbc;
    private String schema;

    @BeforeEach void setUp() {
        String url = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
        String user = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
        String pass = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
        dataSource = new DriverManagerDataSource(url, user, pass);
        jdbc = new JdbcTemplate(dataSource);
        schema = "phase2_v34_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("CREATE SCHEMA " + schema);
    }

    @AfterEach void tearDown() {
        if (jdbc != null && schema != null) jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
    }

    @Test void migratesForwardAndEnforcesReconciliationStateMatrix() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("34").load().migrate();
        assertThat(jdbc.queryForObject("SELECT version FROM " + schema + ".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("34");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname='uq_live_phase2_reconciliation'", Integer.class, schema)).isEqualTo(1);

        long customer = insertUser();
        long order = insertOrder(customer);
        long approvedBase = insertQuote(order, null, "INITIAL", "APPROVED", "100.00");
        long addendum = insertQuote(order, approvedBase, "MATERIAL_ADDENDUM", "APPROVED", "100.00");

        long openOrder = insertOrder(customer);
        long openPartial = insertReconciliation(openOrder, "OPEN", "100.00", "150.00", "50.00", null, null, null);
        jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET correction_type='MATERIAL_ADDENDUM', correction_addendum_id=? WHERE id=?", addendum, openPartial);
        long exactOrder = insertOrder(customer);
        long exactResolved = insertReconciliation(exactOrder, "RESOLVED", "200.00", "200.00", "0.00", "MATERIAL_ADDENDUM", null, addendum);
        long overOrder = insertOrder(customer);
        long overResolved = insertReconciliation(overOrder, "RESOLVED", "250.00", "200.00", "-50.00", "MATERIAL_ADDENDUM", null, addendum);
        long lowerOrder = insertOrder(customer);
        long lowerActual = insertReconciliation(lowerOrder, "RESOLVED", "200.00", "150.00", "-50.00", null, null, null);
        long awaitingOrder = insertOrder(customer);
        long awaiting = insertReconciliation(awaitingOrder, "AWAITING_CUSTOMER_APPROVAL", "200.00", "250.00", "50.00", "MATERIAL_ADDENDUM", null, addendum);
        long cancelledOrder = insertOrder(customer);
        long cancelled = insertReconciliation(cancelledOrder, "CLOSED_CANCELLED", "200.00", "250.00", "50.00", "CANCEL", null, null);

        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET resolved_at=CURRENT_TIMESTAMP WHERE id=?", openPartial));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET status='RESOLVED', variance_amount=1.00, resolved_at=CURRENT_TIMESTAMP WHERE id=?", openPartial));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET correction_quote_id=? WHERE id=?", approvedBase, openPartial));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET correction_type='REVISION', correction_addendum_id=NULL, correction_quote_id=NULL WHERE id=?", exactResolved));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET correction_type='REVISION', correction_addendum_id=NULL, correction_quote_id=NULL WHERE id=?", overResolved));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET status='OPEN', resolved_at=NULL WHERE id=?", lowerActual));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET resolved_at=CURRENT_TIMESTAMP WHERE id=?", awaiting));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET correction_type=NULL WHERE id=?", cancelled));
        assertRejected(() -> jdbc.update("INSERT INTO " + schema + ".phase2_reconciliations(service_order_id,authorization_snapshot_amount,legacy_repair_amount,variance_amount,reason,status,created_by,resolved_at) VALUES (?,1,2,1,'positive resolved','RESOLVED',?,CURRENT_TIMESTAMP)", insertOrder(customer), customer));
        assertRejected(() -> jdbc.update("INSERT INTO " + schema + ".phase2_reconciliations(service_order_id,authorization_snapshot_amount,legacy_repair_amount,variance_amount,reason,status,created_by,resolved_at) VALUES (?,2,2,0,'zero without correction','RESOLVED',?,CURRENT_TIMESTAMP)", insertOrder(customer), customer));
        assertRejected(() -> jdbc.update("UPDATE " + schema + ".phase2_reconciliations SET correction_type='MATERIAL_ADDENDUM', correction_quote_id=?, correction_addendum_id=NULL WHERE id=?", addendum, lowerActual));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM " + schema + ".phase2_reconciliations", Integer.class)).isEqualTo(6);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=? AND c.conname IN ('ck_reconciliation_terminal_timestamp','ck_reconciliation_correction_ref_strict','ck_reconciliation_terminal_type','ck_reconciliation_variance_status')", Integer.class, schema)).isEqualTo(4);
    }

    private long insertUser() {
        return jdbc.queryForObject("INSERT INTO " + schema + ".users(email,password,full_name,phone,role) VALUES (?,?,?,?,?) RETURNING id",
                Long.class, "v34-" + UUID.randomUUID() + "@test", "x", "v34", "9876543210", "CUSTOMER");
    }

    private long insertOrder(long customer) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".service_orders(customer_id,status,request_type,description) VALUES (?,'IN_PROGRESS','NEARBY_AUTO','v34 test') RETURNING id", Long.class, customer);
    }

    private long insertQuote(long order, Long base, String kind, String state, String amount) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".service_quotes(service_order_id,quote_kind,state,version,amount,labor_subtotal,known_material_subtotal,currency,base_quote_id,approved_at) VALUES (?,?,?,1,?,0,?, 'INR', ?, CURRENT_TIMESTAMP) RETURNING id",
                Long.class, order, kind, state, new java.math.BigDecimal(amount), new java.math.BigDecimal(amount), base);
    }

    private long insertReconciliation(long order, String status, String authorized, String actual, String variance,
                                      String type, Long quote, Long addendum) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".phase2_reconciliations(service_order_id,authorization_snapshot_amount,legacy_repair_amount,variance_amount,reason,status,correction_type,correction_quote_id,correction_addendum_id,created_by,resolved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING id",
                Long.class, order, new java.math.BigDecimal(authorized), new java.math.BigDecimal(actual), new java.math.BigDecimal(variance), "test", status, type, quote, addendum, 1L,
                Set.of("RESOLVED", "CLOSED_CANCELLED").contains(status) ? java.time.LocalDateTime.now() : null);
    }

    private void assertRejected(Runnable statement) {
        assertThatThrownBy(statement::run).isInstanceOf(DataIntegrityViolationException.class);
    }
}
