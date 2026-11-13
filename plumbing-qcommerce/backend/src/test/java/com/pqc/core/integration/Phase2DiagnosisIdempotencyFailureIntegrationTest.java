package com.pqc.core.integration;

import com.pqc.core.config.Phase2Properties;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.flywaydb.core.Flyway;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Import(Phase2DiagnosisIdempotencyFailureIntegrationTest.FaultConfiguration.class)
class Phase2DiagnosisIdempotencyFailureIntegrationTest {
    private static final String PG_URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String PG_USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PG_PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_idem_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry r) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD));
        admin.execute("CREATE SCHEMA " + SCHEMA);
        Flyway.configure().dataSource(PG_URL, PG_USER, PG_PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA).locations("classpath:db/migration").load().migrate();
        r.add("spring.datasource.url", () -> PG_URL + (PG_URL.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        r.add("spring.datasource.username", () -> PG_USER);
        r.add("spring.datasource.password", () -> PG_PASSWORD);
        r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        r.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        r.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        r.add("spring.flyway.enabled", () -> false);
        r.add("phase2-diagnosis-quotes.enabled", () -> true);
        r.add("app.photos.storage-dir", () -> "target/phase2-diagnosis-failure-photos");
    }

    @Autowired ServiceDiagnosisService diagnosis;
    @Autowired ServiceDiagnosisRepository diagnoses;
    @Autowired ServiceDiagnosisEvidenceRepository evidence;
    @Autowired Phase2IdempotencyKeyRepository idempotency;
    @Autowired ServiceQuoteEventRepository events;
    @Autowired OutboxEventRepository outbox;
    @Autowired Phase2IdempotencyService idem;
    @Autowired TestFaultInjector faultInjector;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;

    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test
    void createFailureIsTerminalAndDoesNotLeaveBusinessRows() {
        Fixture f = fixture();
        f.order.setStatus(OrderStatus.CANCELLED);
        orders.saveAndFlush(f.order);
        String key = "create-fail";
        assertFailure(f.plumber, () -> diagnosis.create(f.order.getId(), request("x"), key), 409);
        assertFailed(f.plumber, "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), key);
        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).isEmpty();
        assertThat(events.findAll().stream().filter(e -> e.getServiceOrderId().equals(f.order.getId())).count()).isZero();
        assertThat(outbox.findAll().stream().filter(e -> String.valueOf(f.order.getId()).equals(e.getAggregateId())).count()).isZero();
        assertFailure(f.plumber, () -> diagnosis.create(f.order.getId(), request("x"), key), 409);
    }

    @Test
    void submitFailureIsTerminalAndNewKeyIsRequired() {
        Fixture f = fixture();
        PlumberDiagnosisResponse created = call(f.plumber, () -> diagnosis.create(f.order.getId(), request("draft"), "create"));
        String key = "submit-fail";
        assertFailure(f.plumber, () -> diagnosis.submit(f.order.getId(), created.id(), key), 400);
        assertFailed(f.plumber, "SUBMIT_DIAGNOSIS", "DIAGNOSIS", created.id(), key);
        assertThat(diagnoses.findById(created.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.DRAFT);
        assertFailure(f.plumber, () -> diagnosis.submit(f.order.getId(), created.id(), key), 400);
    }

    @Test
    void updateRevisionAndCancelFailuresReplaySafely() {
        Fixture f = fixture();
        PlumberDiagnosisResponse d = call(f.plumber, () -> diagnosis.create(f.order.getId(), request("draft"), "create"));
        MultipartFile photo = new MockMultipartFile("file", "x.jpg", "image/jpeg", new byte[]{1});
        call(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), d.id(), photo, "evidence"));
        PlumberDiagnosisResponse submitted = call(f.plumber, () -> diagnosis.submit(f.order.getId(), d.id(), "submit"));

        assertFailure(f.plumber, () -> diagnosis.update(f.order.getId(), submitted.id(), update("bad", submitted.version()), "update-fail"), 409);
        assertFailure(f.plumber, () -> diagnosis.update(f.order.getId(), submitted.id(), update("bad", submitted.version()), "update-fail"), 409);
        assertFailed(f.plumber, "UPDATE_DIAGNOSIS", "DIAGNOSIS", submitted.id(), "update-fail");

        PlumberDiagnosisResponse revision = call(f.plumber, () -> diagnosis.createRevision(f.order.getId(), submitted.id(), request("rev"), "revision"));
        assertFailure(f.plumber, () -> diagnosis.createRevision(f.order.getId(), submitted.id(), request("rev2"), "revision-fail"), 409);
        assertFailure(f.plumber, () -> diagnosis.createRevision(f.order.getId(), submitted.id(), request("rev2"), "revision-fail"), 409);
        assertFailed(f.plumber, "CREATE_DIAGNOSIS_REVISION", "DIAGNOSIS", submitted.id(), "revision-fail");
    }

    @Test
    void completionFailureRollsBackMutationEventsAndOutboxThenPersistsFailed() {
        Fixture f = fixture();
        invokeCompletionFaultHook();
        String key = "atomic-fail";
        assertThatThrownBy(() -> call(f.plumber, () -> diagnosis.create(f.order.getId(), request("atomic"), key)))
                .isInstanceOf(RuntimeException.class);
        assertFailed(f.plumber, "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), key);
        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).isEmpty();
        assertThat(events.findAll().stream().filter(e -> e.getServiceOrderId().equals(f.order.getId())).count()).isZero();
        assertThat(outbox.findAll().stream().filter(e -> String.valueOf(f.order.getId()).equals(e.getAggregateId())).count()).isZero();
    }

    @Test
    void recentAndStaleInProgressClaimsNeverExecuteBusiness() {
        Fixture f = fixture();
        Phase2IdempotencyKey recent = idem.begin(f.plumber.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), "recent", "fp");
        assertFailure(f.plumber, () -> diagnosis.create(f.order.getId(), request("x"), "recent"), 409);
        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).isEmpty();
        Fixture fingerprintSource = fixture();
        call(fingerprintSource.plumber, () -> diagnosis.create(fingerprintSource.order.getId(), request("x"), "stale-fingerprint-source"));
        String fingerprint = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(
                fingerprintSource.plumber.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", fingerprintSource.order.getId(), "stale-fingerprint-source")
                .orElseThrow().getRequestFingerprint();
        Phase2IdempotencyKey stale = idem.begin(f.plumber.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), "stale", fingerprint);
        stale.setUpdatedAt(LocalDateTime.now().minusMinutes(20));
        idempotency.saveAndFlush(stale);
        assertFailure(f.plumber, () -> diagnosis.create(f.order.getId(), request("x"), "stale"), 409);
        assertThat(idempotency.findById(stale.getId()).orElseThrow().getStatus()).isEqualTo(Phase2IdempotencyStatus.FAILED);
    }

    @Test
    void evidenceFailureDoesNotCreateLinkOrUnintendedTransition() {
        Fixture f = fixture();
        PlumberDiagnosisResponse d = call(f.plumber, () -> diagnosis.create(f.order.getId(), request("draft"), "create"));
        MultipartFile photo = new MockMultipartFile("file", "wrong.jpg", "image/jpeg", new byte[]{9, 8});
        call(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), d.id(), photo, "evidence-setup"));
        call(f.plumber, () -> diagnosis.submit(f.order.getId(), d.id(), "submit-evidence-setup"));
        assertFailure(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), d.id(), photo, "evidence-fail"), 409);
        assertFailed(f.plumber, "LINK_DIAGNOSIS_EVIDENCE", "DIAGNOSIS", d.id(), "evidence-fail");
        assertThat(evidence.findByDiagnosisIdOrderByCreatedAtAsc(d.id())).hasSize(1);
    }

    @Test
    void cancelFailureIsTerminalAndDoesNotEmitCancellationTransition() {
        Fixture f = fixture();
        PlumberDiagnosisResponse created = call(f.plumber, () -> diagnosis.create(f.order.getId(), request("cancel-failure"), "cancel-create"));
        ServiceDiagnosis stored = diagnoses.findById(created.id()).orElseThrow();
        stored.setState(DiagnosisState.CANCELLED);
        diagnoses.saveAndFlush(stored);
        User operations = user(Role.OPERATIONS_ADMIN, "operations");
        String key = "cancel-fail";

        assertFailure(operations, () -> diagnosis.cancel(f.order.getId(), created.id(), key), 409);
        assertFailed(operations, "CANCEL_DIAGNOSIS", "DIAGNOSIS", created.id(), key);
        assertThat(diagnoses.findById(created.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED);
        assertThat(events.findAll().stream().filter(e -> created.id().equals(e.getDiagnosisId()) && "DIAGNOSIS_CANCELLED".equals(e.getEventType())).count()).isZero();
        assertThat(outbox.findAll().stream().filter(e -> String.valueOf(created.id()).equals(e.getAggregateId()) && "DIAGNOSIS_CANCELLED".equals(e.getEventType())).count()).isZero();
        assertFailure(operations, () -> diagnosis.cancel(f.order.getId(), created.id(), key), 409);
    }

    @Test
    void completionFaultIsNotExposedByProductionServiceSurface() {
        assertThat(Arrays.stream(Phase2IdempotencyService.class.getDeclaredMethods())
                .map(java.lang.reflect.Method::getName)
                .noneMatch(name -> name.toLowerCase().contains("fault") || name.toLowerCase().contains("failnext")))
                .isTrue();
        NoOpPhase2IdempotencyCompletionFaultInjector production = new NoOpPhase2IdempotencyCompletionFaultInjector();
        production.beforeComplete(1L, "{}");
    }

    private void assertFailed(User actor, String operation, String type, Long resource, String key) {
        Phase2IdempotencyKey row = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), operation, type, resource, key).orElseThrow();
        assertThat(row.getStatus()).isEqualTo(Phase2IdempotencyStatus.FAILED);
        assertThat(row.getResponsePayload()).isNotBlank().doesNotContain("Exception", "SQLException", "at ", "\\");
    }

    private void invokeCompletionFaultHook() {
        faultInjector.failNext();
    }

    @TestConfiguration
    static class FaultConfiguration {
        @Bean
        @Primary
        TestFaultInjector completionFaultInjector() {
            return new TestFaultInjector();
        }
    }

    static class TestFaultInjector implements Phase2IdempotencyCompletionFaultInjector {
        private final AtomicBoolean failNext = new AtomicBoolean();

        void failNext() { failNext.set(true); }

        @Override
        public void beforeComplete(Long id, String response) {
            if (failNext.compareAndSet(true, false)) throw new IllegalStateException("test completion failure");
        }
    }

    private void assertFailure(User actor, Callable<?> action, int status) {
        ResponseStatusException ex = org.assertj.core.api.Assertions.catchThrowableOfType(() -> call(actor, action), ResponseStatusException.class);
        assertThat(ex).isNotNull();
        assertThat(ex.getStatusCode().value()).isEqualTo(status);
    }

    private <T> T call(User actor, Callable<T> action) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(actor.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + actor.getRole()))));
        SecurityContextHolder.setContext(context);
        try { return action.call(); } catch (Exception e) { if (e instanceof RuntimeException r) throw r; throw new RuntimeException(e); }
    }

    private Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer"); User plumber = user(Role.PLUMBER, "plumber");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber).requestType(RequestType.NEARBY_AUTO).description("failure test").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        order = orders.saveAndFlush(order);
        return new Fixture(order, plumber);
    }
    private User user(Role role, String prefix) { return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x").fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build()); }
    private DiagnosisDraftRequest request(String n) { return new DiagnosisDraftRequest("pipe", "condition", n, "repair", new BigDecimal("1.00"), "washer", "none", false); }
    private DiagnosisDraftUpdateRequest update(String n, Long v) { return new DiagnosisDraftUpdateRequest("pipe", "condition", n, "repair", new BigDecimal("1.00"), "washer", "none", false, v); }
    private record Fixture(ServiceOrder order, User plumber) {}
}
