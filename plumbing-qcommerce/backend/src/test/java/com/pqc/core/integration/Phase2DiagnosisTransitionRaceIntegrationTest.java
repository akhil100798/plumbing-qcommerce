package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.ServiceDiagnosisService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/** PostgreSQL contention proof for competing diagnosis transitions and supersession. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2DiagnosisTransitionRaceIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_race_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry r) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(URL, USER, PASSWORD));
        admin.execute("CREATE SCHEMA " + SCHEMA);
        Flyway.configure().dataSource(URL, USER, PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA)
                .locations("classpath:db/migration").load().migrate();
        r.add("spring.datasource.url", () -> URL + (URL.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        r.add("spring.datasource.username", () -> USER);
        r.add("spring.datasource.password", () -> PASSWORD);
        r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        r.add("spring.datasource.hikari.maximum-pool-size", () -> 4);
        r.add("spring.datasource.hikari.minimum-idle", () -> 0);
        r.add("spring.datasource.hikari.connection-timeout", () -> 30000);
        r.add("spring.datasource.hikari.idle-timeout", () -> 600000);
        r.add("spring.datasource.hikari.max-lifetime", () -> 1800000);
        r.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        r.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        r.add("spring.flyway.enabled", () -> false);
        r.add("phase2-diagnosis-quotes.enabled", () -> true);
        r.add("app.photos.storage-dir", () -> "target/phase2-race-photos");
    }

    @Autowired ServiceDiagnosisService diagnosis;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired ServiceDiagnosisRepository diagnoses;
    @Autowired ServiceDiagnosisEvidenceRepository evidence;
    @Autowired Phase2IdempotencyKeyRepository idempotency;
    @Autowired ServiceQuoteEventRepository events;
    @Autowired OutboxEventRepository outbox;

    @AfterEach void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test
    void submitVsCancelRaceRunsThreeTimesWithoutInvalidState() throws Exception {
        for (int run = 1; run <= 3; run++) {
            final int iteration = run;
            Fixture f = fixture("submit-cancel-" + iteration);
            PlumberDiagnosisResponse created = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("race-" + iteration), "create-" + iteration));
            addEvidence(f, created.id(), "evidence-" + iteration);

            RaceResult submit = race(() -> as(f.plumber, () -> diagnosis.submit(f.order.getId(), created.id(), "submit-" + iteration)),
                    () -> as(f.operations, () -> diagnosis.cancel(f.order.getId(), created.id(), "cancel-" + iteration)));
            assertNoInfrastructureFailure(submit);

            ServiceDiagnosis finalDiagnosis = diagnoses.findById(created.id()).orElseThrow();
            assertThat(finalDiagnosis.getState()).isIn(DiagnosisState.SUBMITTED, DiagnosisState.CANCELLED);
            assertThat(submit.successes()).as("run %s must have one logical winner", run).isEqualTo(1);
            assertThat(submit.failures()).as("run %s must have one deterministic loser", run).isEqualTo(1);
            assertTerminal(f.plumber, "SUBMIT_DIAGNOSIS", created.id(), "submit-" + iteration, submit.submitResult());
            assertTerminal(f.operations, "CANCEL_DIAGNOSIS", created.id(), "cancel-" + iteration, submit.cancelResult());

            long submittedEvents = diagnosisEvent(created.id(), "DIAGNOSIS_SUBMITTED");
            long cancelledEvents = diagnosisEvent(created.id(), "DIAGNOSIS_CANCELLED");
            long submittedOutbox = diagnosisOutbox(created.id(), "DIAGNOSIS_SUBMITTED");
            long cancelledOutbox = diagnosisOutbox(created.id(), "DIAGNOSIS_CANCELLED");
            if (finalDiagnosis.getState() == DiagnosisState.SUBMITTED) {
                assertThat(submittedEvents).isEqualTo(1);
                assertThat(cancelledEvents).isZero();
                assertThat(submittedOutbox).isEqualTo(1);
                assertThat(cancelledOutbox).isZero();
            } else {
                assertThat(cancelledEvents).isEqualTo(1);
                assertThat(submittedEvents).isZero();
                assertThat(cancelledOutbox).isEqualTo(1);
                assertThat(submittedOutbox).isZero();
            }
            assertThat(idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(f.plumber.getId(), "SUBMIT_DIAGNOSIS", "DIAGNOSIS", created.id(), "submit-" + run).orElseThrow().getStatus()).isNotEqualTo(Phase2IdempotencyStatus.IN_PROGRESS);
            assertThat(idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(f.operations.getId(), "CANCEL_DIAGNOSIS", "DIAGNOSIS", created.id(), "cancel-" + run).orElseThrow().getStatus()).isNotEqualTo(Phase2IdempotencyStatus.IN_PROGRESS);
        }
    }

    @Test
    void revisionCreationRaceRunsThreeTimesWithoutDuplicateDraft() throws Exception {
        for (int run = 1; run <= 3; run++) {
            final int iteration = run;
            Fixture f = fixture("revision-race-" + iteration);
            PlumberDiagnosisResponse original = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("original-" + iteration), "create-" + iteration));
            addEvidence(f, original.id(), "original-evidence-" + iteration);
            as(f.plumber, () -> diagnosis.submit(f.order.getId(), original.id(), "submit-" + iteration));

            RaceResult revisions = race(
                    () -> as(f.plumber, () -> diagnosis.createRevision(f.order.getId(), original.id(), request("revision-a-" + iteration), "revision-a-" + iteration)),
                    () -> as(f.plumber, () -> diagnosis.createRevision(f.order.getId(), original.id(), request("revision-b-" + iteration), "revision-b-" + iteration)));
            assertNoInfrastructureFailure(revisions);
            assertThat(revisions.successes()).as("run %s must create one replacement", run).isEqualTo(1);
            assertThat(revisions.failures()).as("run %s must reject one replacement", run).isEqualTo(1);

            List<ServiceDiagnosis> all = diagnoses.findByServiceOrderId(f.order.getId());
            List<ServiceDiagnosis> replacements = all.stream().filter(d -> original.id().equals(d.getRevisionOfDiagnosis() == null ? null : d.getRevisionOfDiagnosis().getId())).toList();
            assertThat(replacements).as("run %s replacement count", run).hasSize(1);
            assertThat(replacements.get(0).getState()).isEqualTo(DiagnosisState.DRAFT);
            assertThat(diagnoses.findRevisionOf(original.id()).orElseThrow().getId()).isEqualTo(replacements.get(0).getId());
            assertThat(all.stream().filter(d -> d.getState() == DiagnosisState.DRAFT).count()).isEqualTo(1);
            assertThat(all.stream().filter(d -> d.getVersionNumber().equals(replacements.get(0).getVersionNumber())).count()).isEqualTo(1);
            assertThat(diagnosisEvent(replacements.get(0).getId(), "DIAGNOSIS_CREATED")).isZero();
            assertThat(diagnosisOutbox(replacements.get(0).getId(), "DIAGNOSIS_CREATED")).isZero();
            assertRevisionTerminal(f.plumber, original.id(), "revision-a-" + iteration);
            assertRevisionTerminal(f.plumber, original.id(), "revision-b-" + iteration);
        }
    }

    @Test
    void replacementSubmissionRaceSupersedesOriginalExactlyOnce() throws Exception {
        Fixture f = fixture("supersession");
        PlumberDiagnosisResponse original = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("original"), "sup-create"));
        addEvidence(f, original.id(), "sup-original-evidence");
        as(f.plumber, () -> diagnosis.submit(f.order.getId(), original.id(), "sup-submit-original"));
        DiagnosisDraftRequest replacementBody = request("replacement");
        PlumberDiagnosisResponse replacement = as(f.plumber, () -> diagnosis.createRevision(f.order.getId(), original.id(), replacementBody, "sup-revision"));
        addEvidence(f, replacement.id(), "sup-replacement-evidence");

        RaceResult submits = race(
                () -> as(f.plumber, () -> diagnosis.submit(f.order.getId(), replacement.id(), "sup-submit-a")),
                () -> as(f.plumber, () -> diagnosis.submit(f.order.getId(), replacement.id(), "sup-submit-b")));
        assertNoInfrastructureFailure(submits);
        assertThat(submits.successes()).isEqualTo(1);
        assertThat(submits.failures()).isEqualTo(1);
        assertThat(diagnoses.findById(original.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUPERSEDED);
        assertThat(diagnoses.findById(replacement.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUBMITTED);
        assertThat(diagnosisEvent(original.id(), "DIAGNOSIS_SUPERSEDED")).isEqualTo(1);
        assertThat(diagnosisEvent(replacement.id(), "DIAGNOSIS_SUBMITTED")).isEqualTo(1);
        assertThat(diagnosisOutbox(original.id(), "DIAGNOSIS_SUPERSEDED")).isEqualTo(1);
        assertThat(diagnosisOutbox(replacement.id(), "DIAGNOSIS_SUBMITTED")).isEqualTo(1);
        assertThat(diagnoses.findRevisionOf(original.id()).orElseThrow().getId()).isEqualTo(replacement.id());
    }

    private RaceResult race(Callable<?> first, Callable<?> second) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Future<Object> a = pool.submit(() -> invokeAfter(start, first));
        Future<Object> b = pool.submit(() -> invokeAfter(start, second));
        start.countDown();
        try {
            Object one = a.get(15, TimeUnit.SECONDS);
            Object two = b.get(15, TimeUnit.SECONDS);
            return new RaceResult(one, two);
        } finally {
            pool.shutdownNow();
            assertThat(pool.awaitTermination(2, TimeUnit.SECONDS)).isTrue();
        }
    }

    private Object invokeAfter(CountDownLatch start, Callable<?> call) {
        try { start.await(15, TimeUnit.SECONDS); return call.call(); }
        catch (Throwable t) { return t; }
    }

    private void assertNoInfrastructureFailure(RaceResult result) {
        for (Throwable failure : result.failuresList()) {
            assertThat(failure).isInstanceOf(ResponseStatusException.class);
            assertThat(((ResponseStatusException) failure).getStatusCode().value()).isEqualTo(409);
        }
    }

    private void assertTerminal(User actor, String operation, Long diagnosisId, String key, Object result) {
        Phase2IdempotencyKey row = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), operation, "DIAGNOSIS", diagnosisId, key).orElseThrow();
        assertThat(row.getStatus()).isIn(Phase2IdempotencyStatus.COMPLETED, Phase2IdempotencyStatus.FAILED);
        if (result instanceof Throwable) assertThat(row.getStatus()).isEqualTo(Phase2IdempotencyStatus.FAILED);
        else assertThat(row.getStatus()).isEqualTo(Phase2IdempotencyStatus.COMPLETED);
    }

    private void assertRevisionTerminal(User actor, Long originalId, String key) {
        Phase2IdempotencyKey row = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), "CREATE_DIAGNOSIS_REVISION", "DIAGNOSIS", originalId, key).orElseThrow();
        assertThat(row.getStatus()).isIn(Phase2IdempotencyStatus.COMPLETED, Phase2IdempotencyStatus.FAILED);
    }

    private long diagnosisEvent(Long diagnosisId, String type) { return events.findAll().stream().filter(e -> diagnosisId.equals(e.getDiagnosisId()) && type.equals(e.getEventType())).count(); }
    private long diagnosisOutbox(Long diagnosisId, String type) { return outbox.findAll().stream().filter(e -> String.valueOf(diagnosisId).equals(e.getAggregateId()) && type.equals(e.getEventType())).count(); }
    private void addEvidence(Fixture f, Long diagnosisId, String key) { as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), diagnosisId, new MockMultipartFile("file", key + ".jpg", "image/jpeg", new byte[]{1, 2, 3}), key)); }
    private DiagnosisDraftRequest request(String narrative) { return new DiagnosisDraftRequest("pipe", "condition", narrative, "repair", new BigDecimal("1.00"), "washer", "none", false); }
    private Fixture fixture(String description) { User customer = user(Role.CUSTOMER, "customer"); User plumber = user(Role.PLUMBER, "plumber"); User operations = user(Role.OPERATIONS_ADMIN, "operations"); ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber).requestType(RequestType.NEARBY_AUTO).description(description).build()); order.setStatus(OrderStatus.IN_PROGRESS); order.setArrivedAt(LocalDateTime.now()); return new Fixture(orders.saveAndFlush(order), plumber, operations); }
    private User user(Role role, String prefix) { return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x").fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build()); }
    private <T> T as(User actor, Callable<T> action) { var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(new UsernamePasswordAuthenticationToken(actor.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + actor.getRole())))); SecurityContextHolder.setContext(context); try { return action.call(); } catch (Exception e) { if (e instanceof RuntimeException r) throw r; throw new RuntimeException(e); } finally { SecurityContextHolder.clearContext(); } }

    private record Fixture(ServiceOrder order, User plumber, User operations) {}
    private record RaceResult(Object first, Object second) { long successes() { return List.of(first, second).stream().filter(x -> !(x instanceof Throwable)).count(); } long failures() { return 2 - successes(); } List<Throwable> failuresList() { return List.of(first, second).stream().filter(Throwable.class::isInstance).map(Throwable.class::cast).toList(); } Object submitResult() { return first; } Object cancelResult() { return second; } }
}
