package com.pqc.core.migration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.LaunchPolicyService;
import com.pqc.core.service.LaunchRosterManagementService;
import com.pqc.core.service.PlumberEligibilityService;
import com.pqc.core.dto.LaunchRosterPlumberResponse;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.flywaydb.core.Flyway;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Real PostgreSQL-backed certification test for Launch Roster Management,
 * Audit History immutability, and Plumber Eligibility Service contracts.
 */
@SpringBootTest
@ActiveProfiles("test")
class LaunchRosterManagementPostgresIntegrationTest {
    private static final String PG_URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String PG_USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PG_PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String TEST_SCHEMA = "roster_pg_cert_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD));
        admin.execute("CREATE SCHEMA " + TEST_SCHEMA);
        Flyway.configure().dataSource(PG_URL, PG_USER, PG_PASSWORD).schemas(TEST_SCHEMA).defaultSchema(TEST_SCHEMA)
                .locations("classpath:db/migration").load().migrate();
        registry.add("spring.datasource.url", () -> PG_URL + (PG_URL.contains("?") ? "&" : "?") + "currentSchema=" + TEST_SCHEMA);
        registry.add("spring.datasource.username", () -> PG_USER);
        registry.add("spring.datasource.password", () -> PG_PASSWORD);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> 4);
        registry.add("spring.datasource.hikari.minimum-idle", () -> 0);
        registry.add("spring.datasource.hikari.connection-timeout", () -> 30000);
        registry.add("spring.datasource.hikari.idle-timeout", () -> 600000);
        registry.add("spring.datasource.hikari.max-lifetime", () -> 1800000);
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.flyway.enabled", () -> false);
    }

    @AfterAll
    static void dropSchema() {
        new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD))
                .execute("DROP SCHEMA IF EXISTS " + TEST_SCHEMA + " CASCADE");
    }

    @Autowired UserRepository users;
    @Autowired LaunchPolicyRepository policies;
    @Autowired LaunchPlumberRosterRepository roster;
    @Autowired PlumberKycRepository kycs;
    @Autowired LaunchRosterAuditHistoryRepository audit;
    @Autowired LaunchRosterManagementService rosterService;
    @Autowired PlumberEligibilityService eligibilityService;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;

    private User admin;
    private LaunchPolicy policy;

    @BeforeEach
    void setUp() {
        admin = users.saveAndFlush(User.builder().email("pg-admin-" + UUID.randomUUID() + "@test")
                .password(encoder.encode("pass")).fullName("PG Admin").phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(Role.ADMIN).status(UserStatus.ACTIVE).build());

        policy = policies.findAllByPolicyKeyOrderByIdAsc(LaunchPolicyService.SERVICE_POLICY_KEY).stream().findFirst().orElseGet(() ->
                policies.saveAndFlush(LaunchPolicy.builder().policyKey(LaunchPolicyService.SERVICE_POLICY_KEY)
                        .active(true).rosterEnforcementEnabled(true).currency("INR").build()));
        policy.setActive(true);
        policy.setRosterEnforcementEnabled(true);
        policy = policies.saveAndFlush(policy);
    }

    private User createEligiblePlumber() {
        User plumber = users.saveAndFlush(User.builder().email("pg-plumber-" + UUID.randomUUID() + "@test")
                .password(encoder.encode("pass")).fullName("PG Plumber").phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(Role.PLUMBER).status(UserStatus.ACTIVE).build());
        kycs.saveAndFlush(PlumberKyc.builder().plumberId(plumber.getId()).status(PlumberKycStatus.APPROVED)
                .availabilityStatus(PlumberAvailabilityStatus.ONLINE).build());
        return plumber;
    }

    @Test
    void test01_to_14_rosterLifecycleAndAuditPersistence() {
        User plumber = createEligiblePlumber();

        // 1. activate eligible plumber
        LaunchRosterPlumberResponse actResp = rosterService.activate(policy.getId(), plumber.getId(), admin.getId(), "Initial Activation");
        assertThat(actResp.rosterApproved()).isTrue();

        // 2. activation persists
        LaunchPlumberRoster savedRoster = roster.findByPolicy_IdAndPlumberId(policy.getId(), plumber.getId()).orElseThrow();
        assertThat(savedRoster.isApproved()).isTrue();

        // 3. repeated activation is idempotent
        LaunchRosterPlumberResponse repeatAct = rosterService.activate(policy.getId(), plumber.getId(), admin.getId(), "Repeated Activation");
        assertThat(repeatAct.rosterApproved()).isTrue();
        assertThat(roster.findByPolicy_IdAndPlumberId(policy.getId(), plumber.getId())).isPresent();

        // 7. audit row written for real activation
        // 9. no duplicate audit for an idempotent no-op if that is current contract
        List<LaunchRosterAuditHistory> audits = jdbc.query("SELECT * FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE plumber_id = ?",
                (rs, rowNum) -> LaunchRosterAuditHistory.builder()
                        .id(rs.getLong("id"))
                        .policyId(rs.getLong("policy_id"))
                        .plumberId(rs.getLong("plumber_id"))
                        .actorUserId(rs.getLong("actor_user_id"))
                        .action(LaunchRosterAuditAction.valueOf(rs.getString("action")))
                        .reason(rs.getString("reason"))
                        .build(),
                plumber.getId());
        assertThat(audits).hasSize(1);

        // 10. actor persisted, 11. policy persisted, 12. plumber persisted, 13. action persisted, 14. reason persisted
        LaunchRosterAuditHistory actAudit = audits.get(0);
        assertThat(actAudit.getActorUserId()).isEqualTo(admin.getId());
        assertThat(actAudit.getPolicyId()).isEqualTo(policy.getId());
        assertThat(actAudit.getPlumberId()).isEqualTo(plumber.getId());
        assertThat(actAudit.getAction()).isEqualTo(LaunchRosterAuditAction.ACTIVATED);
        assertThat(actAudit.getReason()).isEqualTo("Initial Activation");

        // 4. deactivate membership
        LaunchRosterPlumberResponse deactResp = rosterService.deactivate(policy.getId(), plumber.getId(), admin.getId(), "Deactivation Reason");
        assertThat(deactResp.rosterApproved()).isFalse();
        assertThat(roster.findByPolicy_IdAndPlumberId(policy.getId(), plumber.getId()).orElseThrow().isApproved()).isFalse();

        // 8. audit row written for real deactivation
        audits = jdbc.query("SELECT * FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE plumber_id = ?",
                (rs, rowNum) -> LaunchRosterAuditHistory.builder()
                        .id(rs.getLong("id"))
                        .policyId(rs.getLong("policy_id"))
                        .plumberId(rs.getLong("plumber_id"))
                        .actorUserId(rs.getLong("actor_user_id"))
                        .action(LaunchRosterAuditAction.valueOf(rs.getString("action")))
                        .reason(rs.getString("reason"))
                        .build(),
                plumber.getId());
        assertThat(audits).hasSize(2);
        LaunchRosterAuditHistory deactAudit = audits.stream().filter(a -> a.getAction() == LaunchRosterAuditAction.DEACTIVATED).findFirst().orElseThrow();
        assertThat(deactAudit.getActorUserId()).isEqualTo(admin.getId());
        assertThat(deactAudit.getPolicyId()).isEqualTo(policy.getId());
        assertThat(deactAudit.getPlumberId()).isEqualTo(plumber.getId());
        assertThat(deactAudit.getReason()).isEqualTo("Deactivation Reason");

        // 5. repeated deactivation according to contract
        LaunchRosterPlumberResponse repeatDeact = rosterService.deactivate(policy.getId(), plumber.getId(), admin.getId(), "Repeated Deact");
        assertThat(repeatDeact.rosterApproved()).isFalse();
        int finalAuditCount = jdbc.queryForObject("SELECT count(*) FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE plumber_id = ?", Integer.class, plumber.getId());
        assertThat(finalAuditCount).isEqualTo(2); // no duplicate audit for no-op deactivation
    }

    @Test
    void test06_uniquePolicyAndPlumberConstraintEnforcedByPostgres() {
        User plumber = createEligiblePlumber();
        // 6. unique policy + plumber membership
        roster.saveAndFlush(LaunchPlumberRoster.builder().policy(policy).plumberId(plumber.getId()).approved(true).build());
        assertThatThrownBy(() -> {
            jdbc.execute("INSERT INTO " + TEST_SCHEMA + ".launch_plumber_roster(policy_id, plumber_id, approved) VALUES (" + policy.getId() + ", " + plumber.getId() + ", TRUE)");
        }).isInstanceOf(Exception.class);
    }

    @Test
    void test15_16_rosterMutationAndAuditWriteAtomicRollback() {
        User plumber = createEligiblePlumber();
        // 15. roster mutation and audit write are atomic
        // 16. rollback if audit write fails (e.g. simulated by invalid foreign key or transaction failure)
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        assertThatThrownBy(() -> {
            tx.execute(status -> {
                rosterService.activate(policy.getId(), plumber.getId(), admin.getId(), "Atomic test");
                throw new RuntimeException("Simulated post-activation failure to verify rollback");
            });
        }).isInstanceOf(RuntimeException.class).hasMessageContaining("Simulated post-activation failure");

        // After rollback, neither roster nor audit row must exist for this plumber
        assertThat(roster.findByPolicy_IdAndPlumberId(policy.getId(), plumber.getId())).isEmpty();
        int auditCount = jdbc.queryForObject("SELECT count(*) FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE plumber_id = ?", Integer.class, plumber.getId());
        assertThat(auditCount).isZero();
    }

    @Test
    void test17_18_19_auditImmutabilityEnforcedByPostgresTriggers() {
        User plumber = createEligiblePlumber();
        // 17. audit UPDATE rejected
        // 18. audit DELETE rejected
        // 19. audit TRUNCATE rejected
        rosterService.activate(policy.getId(), plumber.getId(), admin.getId(), "For Trigger Check");
        Long auditId = jdbc.queryForObject("SELECT id FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE plumber_id = ?", Long.class, plumber.getId());

        // UPDATE rejected
        assertThatThrownBy(() -> jdbc.update("UPDATE " + TEST_SCHEMA + ".launch_roster_audit_history SET reason='tampered' WHERE id=?", auditId))
                .isInstanceOf(Exception.class);

        // DELETE rejected
        assertThatThrownBy(() -> jdbc.update("DELETE FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE id=?", auditId))
                .isInstanceOf(Exception.class);

        // TRUNCATE rejected
        assertThatThrownBy(() -> jdbc.execute("TRUNCATE TABLE " + TEST_SCHEMA + ".launch_roster_audit_history"))
                .isInstanceOf(Exception.class);

        // Verify row is still intact
        assertThat(jdbc.queryForObject("SELECT count(*) FROM " + TEST_SCHEMA + ".launch_roster_audit_history WHERE id=?", Integer.class, auditId)).isEqualTo(1);
    }

    @Test
    void test20_to_23_plumberEligibilityInteractions() {
        User plumber = createEligiblePlumber();

        // 20. roster enforcement OFF => eligible without membership
        policy.setActive(true);
        policy.setRosterEnforcementEnabled(false);
        policies.saveAndFlush(policy);
        assertThat(eligibilityService.isEligibleForLaunch(plumber)).isTrue();

        // 21. roster enforcement ON + no membership => not eligible
        policy.setRosterEnforcementEnabled(true);
        policies.saveAndFlush(policy);
        assertThat(eligibilityService.isEligibleForLaunch(plumber)).isFalse();

        // 22. roster enforcement ON + approved membership => eligible
        rosterService.activate(policy.getId(), plumber.getId(), admin.getId(), "Activating for launch");
        assertThat(eligibilityService.isEligibleForLaunch(plumber)).isTrue();

        // 23. deactivated membership => not eligible
        rosterService.deactivate(policy.getId(), plumber.getId(), admin.getId(), "Deactivating from launch");
        assertThat(eligibilityService.isEligibleForLaunch(plumber)).isFalse();
    }
}
