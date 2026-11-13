package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** PostgreSQL success, replay, and fingerprint-conflict matrix for all diagnosis commands. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2DiagnosisSuccessMatrixIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_success_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry r) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(URL, USER, PASSWORD));
        admin.execute("CREATE SCHEMA " + SCHEMA);
        Flyway.configure().dataSource(URL, USER, PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA).locations("classpath:db/migration").load().migrate();
        r.add("spring.datasource.url", () -> URL + (URL.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        r.add("spring.datasource.username", () -> USER);
        r.add("spring.datasource.password", () -> PASSWORD);
        r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        r.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        r.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        r.add("spring.flyway.enabled", () -> false);
        r.add("phase2-diagnosis-quotes.enabled", () -> true);
        r.add("app.photos.storage-dir", () -> "target/phase2-success-matrix-photos");
    }

    @Autowired ServiceDiagnosisService diagnosis;
    @Autowired Phase2IdempotencyService idempotencyService;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired ServiceDiagnosisRepository diagnoses;
    @Autowired ServiceDiagnosisEvidenceRepository evidence;
    @Autowired Phase2EnrollmentRepository enrollments;
    @Autowired Phase2IdempotencyKeyRepository idempotency;
    @Autowired ServiceQuoteEventRepository events;
    @Autowired OutboxEventRepository outbox;
    @Autowired ServiceQuoteRepository quotes;

    @AfterEach void clearAuth() { SecurityContextHolder.clearContext(); }

    // CREATE
    @Test void createSuccessAtomicity() { CreateCase c = createCase("create-success"); assertCreate(c); }
    @Test void createSameKeyReplay() { CreateCase c = createCase("create-replay"); int n = diagnoses.findByServiceOrderId(c.order.getId()).size(); PlumberDiagnosisResponse replay = as(c.plumber, () -> diagnosis.create(c.order.getId(), c.body, c.key)); assertThat(replay.id()).isEqualTo(c.response.id()); assertThat(diagnoses.findByServiceOrderId(c.order.getId())).hasSize(n); assertCreateCounts(c.response.id(), "DIAGNOSIS_CREATED", 1); }
    @Test void createFingerprintConflict() { CreateCase c = createCase("create-conflict"); assertConflict(() -> as(c.plumber, () -> diagnosis.create(c.order.getId(), request("different"), c.key))); assertThat(diagnoses.findByServiceOrderId(c.order.getId())).hasSize(1); assertCreateCounts(c.response.id(), "DIAGNOSIS_CREATED", 1); assertCompleted(c.plumber, "CREATE_DIAGNOSIS", "SERVICE_ORDER", c.order.getId(), c.key); }
    @Test void knownStringHashCollisionWithSameKeyConflicts() {
        Fixture f = fixture();
        DiagnosisDraftRequest first = request("Aa");
        DiagnosisDraftRequest changed = request("BB");
        assertThat(mapperHash(first)).isEqualTo(mapperHash(changed));
        String key = "create-known-hash-collision";

        PlumberDiagnosisResponse created = as(f.plumber, () -> diagnosis.create(f.order.getId(), first, key));
        assertConflict(() -> as(f.plumber, () -> diagnosis.create(f.order.getId(), changed, key)));

        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).hasSize(1);
        assertThat(diagnoses.findById(created.id()).orElseThrow().getDiagnosisNarrative()).isEqualTo("Aa");
    }
    @Test void diagnosisFingerprintIsStableAcrossEquivalentDecimalScales() {
        Fixture f = fixture();
        DiagnosisDraftRequest first = request("stable");
        DiagnosisDraftRequest equivalent = new DiagnosisDraftRequest(first.affectedComponent(), first.observedCondition(),
                first.diagnosisNarrative(), first.recommendedRemedy(), new BigDecimal("1.0"), first.knownMaterialCandidates(),
                first.safetyNotes(), first.safetyBlocked());
        as(f.plumber, () -> diagnosis.create(f.order.getId(), first, "stable-first"));
        as(f.plumber, () -> diagnosis.create(f.order.getId(), equivalent, "stable-second"));

        String firstFingerprint = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(
                f.plumber.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), "stable-first").orElseThrow().getRequestFingerprint();
        String secondFingerprint = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(
                f.plumber.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), "stable-second").orElseThrow().getRequestFingerprint();
        assertThat(firstFingerprint).isEqualTo(secondFingerprint).startsWith("sha256:");
    }

    // UPDATE
    @Test void updateSuccessAtomicity() { UpdateCase c = updateCase("update-success"); assertThat(diagnoses.findById(c.response.id()).orElseThrow().getDiagnosisNarrative()).isEqualTo("updated"); assertCompleted(c.plumber, "UPDATE_DIAGNOSIS", "DIAGNOSIS", c.response.id(), c.key); assertCreateCounts(c.response.id(), "DIAGNOSIS_UPDATED", 1); }
    @Test void updateSameKeyReplay() { UpdateCase c = updateCase("update-replay"); Long version = diagnoses.findById(c.response.id()).orElseThrow().getOptimisticVersion(); as(c.plumber, () -> diagnosis.update(c.order.getId(), c.response.id(), c.body, c.key)); assertThat(diagnoses.findById(c.response.id()).orElseThrow().getOptimisticVersion()).isEqualTo(version); assertCreateCounts(c.response.id(), "DIAGNOSIS_UPDATED", 1); }
    @Test void updateFingerprintConflict() { UpdateCase c = updateCase("update-conflict"); assertConflict(() -> as(c.plumber, () -> diagnosis.update(c.order.getId(), c.response.id(), update("different", c.response.version()), c.key))); assertThat(diagnoses.findById(c.response.id()).orElseThrow().getDiagnosisNarrative()).isEqualTo("updated"); assertCreateCounts(c.response.id(), "DIAGNOSIS_UPDATED", 1); }

    // SUBMIT
    @Test void submitSuccessAtomicity() { SubmitCase c = submitCase("submit-success"); assertThat(diagnoses.findById(c.response.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUBMITTED); assertCompleted(c.plumber, "SUBMIT_DIAGNOSIS", "DIAGNOSIS", c.response.id(), c.key); assertCreateCounts(c.response.id(), "DIAGNOSIS_SUBMITTED", 1); assertThat(quotes.findAll().stream().filter(q -> q.getServiceOrder().getId().equals(c.order.getId())).count()).isEqualTo(1); }
    @Test void submitSameKeyReplay() { SubmitCase c = submitCase("submit-replay"); long q = quoteCount(c.order); as(c.plumber, () -> diagnosis.submit(c.order.getId(), c.response.id(), c.key)); assertThat(quoteCount(c.order)).isEqualTo(q); assertCreateCounts(c.response.id(), "DIAGNOSIS_SUBMITTED", 1); }
    @Test void submitFingerprintConflict() { SubmitCase c = submitCase("submit-conflict"); assertConflict(() -> idempotencyService.begin(c.plumber.getId(), "SUBMIT_DIAGNOSIS", "DIAGNOSIS", c.response.id(), c.key, "different-submit-fingerprint")); assertThat(diagnoses.findById(c.response.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUBMITTED); assertCreateCounts(c.response.id(), "DIAGNOSIS_SUBMITTED", 1); }

    // REVISION
    @Test void revisionSuccessAtomicity() { RevisionCase c = revisionCase("revision-success"); assertThat(diagnoses.findRevisionOf(c.original.getId())).isPresent(); assertThat(diagnoses.findCurrent(c.order.getId(), java.util.Set.of(DiagnosisState.DRAFT))).hasSize(1); assertCompleted(c.plumber, "CREATE_DIAGNOSIS_REVISION", "DIAGNOSIS", c.original.getId(), c.key); assertThat(events.findAll().stream().filter(e -> c.replacement.id().equals(e.getDiagnosisId())).count()).isZero(); }
    @Test void revisionSameKeyReplay() { RevisionCase c = revisionCase("revision-replay"); long count = diagnoses.findByServiceOrderId(c.order.getId()).size(); PlumberDiagnosisResponse replay = as(c.plumber, () -> diagnosis.createRevision(c.order.getId(), c.original.getId(), c.body, c.key)); assertThat(replay.id()).isEqualTo(c.replacement.id()); assertThat(diagnoses.findByServiceOrderId(c.order.getId())).hasSize((int) count); }
    @Test void revisionFingerprintConflict() { RevisionCase c = revisionCase("revision-conflict"); assertConflict(() -> as(c.plumber, () -> diagnosis.createRevision(c.order.getId(), c.original.getId(), request("different"), c.key))); assertThat(diagnoses.findByServiceOrderId(c.order.getId())).hasSize(2); assertCompleted(c.plumber, "CREATE_DIAGNOSIS_REVISION", "DIAGNOSIS", c.original.getId(), c.key); }

    // CANCEL
    @Test void cancelSuccessAtomicity() { CancelCase c = cancelCase("cancel-success"); assertThat(diagnoses.findById(c.diagnosis.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED); assertCompleted(c.operations, "CANCEL_DIAGNOSIS", "DIAGNOSIS", c.diagnosis.getId(), c.key); assertCreateCounts(c.diagnosis.getId(), "DIAGNOSIS_CANCELLED", 1); }
    @Test void cancelSameKeyReplay() { CancelCase c = cancelCase("cancel-replay"); as(c.operations, () -> diagnosis.cancel(c.order.getId(), c.diagnosis.getId(), c.key)); assertThat(diagnoses.findById(c.diagnosis.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED); assertCreateCounts(c.diagnosis.getId(), "DIAGNOSIS_CANCELLED", 1); }
    @Test void cancelFingerprintConflict() { CancelCase c = cancelCase("cancel-conflict"); assertConflict(() -> idempotencyService.begin(c.operations.getId(), "CANCEL_DIAGNOSIS", "DIAGNOSIS", c.diagnosis.getId(), c.key, "different-cancel-fingerprint")); assertThat(diagnoses.findById(c.diagnosis.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED); assertCreateCounts(c.diagnosis.getId(), "DIAGNOSIS_CANCELLED", 1); }

    // EVIDENCE
    @Test void evidenceSuccessAtomicity() { EvidenceCase c = evidenceCase("evidence-success"); assertThat(evidence.findByDiagnosisIdOrderByCreatedAtAsc(c.diagnosis.getId())).hasSize(1); assertCompleted(c.plumber, "LINK_DIAGNOSIS_EVIDENCE", "DIAGNOSIS", c.diagnosis.getId(), c.key); assertThat(nonCreateDiagnosisEvents(c.diagnosis.getId())).isZero(); }
    @Test void evidenceSameKeyReplay() { EvidenceCase c = evidenceCase("evidence-replay"); long n = evidence.findByDiagnosisIdOrderByCreatedAtAsc(c.diagnosis.getId()).size(); as(c.plumber, () -> diagnosis.linkEvidence(c.order.getId(), c.diagnosis.getId(), c.file, c.key)); assertThat(evidence.findByDiagnosisIdOrderByCreatedAtAsc(c.diagnosis.getId())).hasSize((int) n); assertThat(nonCreateDiagnosisEvents(c.diagnosis.getId())).isZero(); }
    @Test void evidenceFingerprintConflict() { EvidenceCase c = evidenceCase("evidence-conflict"); MultipartFile other = new MockMultipartFile("file", "other.jpg", "image/jpeg", new byte[]{8, 7, 6}); assertConflict(() -> as(c.plumber, () -> diagnosis.linkEvidence(c.order.getId(), c.diagnosis.getId(), other, c.key))); assertThat(evidence.findByDiagnosisIdOrderByCreatedAtAsc(c.diagnosis.getId())).hasSize(1); assertThat(nonCreateDiagnosisEvents(c.diagnosis.getId())).isZero(); }
    @Test void knownByteArrayHashCollisionWithSameKeyConflicts() {
        Fixture f = fixture();
        PlumberDiagnosisResponse draft = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("evidence-hash"), "evidence-hash-create"));
        byte[] firstBytes = new byte[]{0, 31};
        byte[] changedBytes = new byte[]{1, 0};
        assertThat(java.util.Arrays.hashCode(firstBytes)).isEqualTo(java.util.Arrays.hashCode(changedBytes));
        MultipartFile first = new MockMultipartFile("file", "first.jpg", "image/jpeg", firstBytes);
        MultipartFile changed = new MockMultipartFile("file", "changed.jpg", "image/jpeg", changedBytes);
        as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), draft.id(), first, "evidence-known-hash-collision"));

        assertConflict(() -> as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), draft.id(), changed, "evidence-known-hash-collision")));
        assertThat(evidence.findByDiagnosisIdOrderByCreatedAtAsc(draft.id())).hasSize(1);
    }

    private CreateCase createCase(String key) { Fixture f = fixture(); DiagnosisDraftRequest body = request("create-" + key); PlumberDiagnosisResponse response = as(f.plumber, () -> diagnosis.create(f.order.getId(), body, key)); return new CreateCase(f.order, f.plumber, body, response, key); }
    private UpdateCase updateCase(String key) { Fixture f = fixture(); PlumberDiagnosisResponse d = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("draft"), "create-" + key)); DiagnosisDraftUpdateRequest body = update("updated", d.version()); PlumberDiagnosisResponse response = as(f.plumber, () -> diagnosis.update(f.order.getId(), d.id(), body, key)); return new UpdateCase(f.order, f.plumber, body, response, key); }
    private SubmitCase submitCase(String key) { Fixture f = fixture(); PlumberDiagnosisResponse d = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("submit"), "create-" + key)); addEvidence(f, d.id(), "evidence-" + key); PlumberDiagnosisResponse response = as(f.plumber, () -> diagnosis.submit(f.order.getId(), d.id(), key)); return new SubmitCase(f.order, f.plumber, response, key); }
    private RevisionCase revisionCase(String key) { SubmitCase s = submitCase("setup-" + key); DiagnosisDraftRequest body = request("revision-" + key); PlumberDiagnosisResponse replacement = as(s.plumber, () -> diagnosis.createRevision(s.order.getId(), s.response.id(), body, key)); return new RevisionCase(s.order, s.plumber, diagnoses.findById(s.response.id()).orElseThrow(), replacement, body, key); }
    private CancelCase cancelCase(String key) { Fixture f = fixture(); PlumberDiagnosisResponse d = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("cancel"), "create-" + key)); User operations = user(Role.OPERATIONS_ADMIN, "operations"); as(operations, () -> diagnosis.cancel(f.order.getId(), d.id(), key)); return new CancelCase(f.order, operations, diagnoses.findById(d.id()).orElseThrow(), key); }
    private EvidenceCase evidenceCase(String key) { Fixture f = fixture(); PlumberDiagnosisResponse d = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("evidence"), "create-" + key)); MultipartFile file = new MockMultipartFile("file", "evidence.jpg", "image/jpeg", new byte[]{1, 2, 3}); as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), d.id(), file, key)); return new EvidenceCase(f.order, f.plumber, diagnoses.findById(d.id()).orElseThrow(), file, key); }

    private void assertCreate(CreateCase c) { assertThat(diagnoses.findById(c.response.id())).isPresent(); assertThat(enrollments.findByServiceOrderId(c.order.getId())).isPresent(); assertCompleted(c.plumber, "CREATE_DIAGNOSIS", "SERVICE_ORDER", c.order.getId(), c.key); assertCreateCounts(c.response.id(), "DIAGNOSIS_CREATED", 1); }
    private void assertCompleted(User actor, String operation, String type, Long resource, String key) { Phase2IdempotencyKey row = idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), operation, type, resource, key).orElseThrow(); assertThat(row.getStatus()).isEqualTo(Phase2IdempotencyStatus.COMPLETED); assertThat(row.getResponsePayload()).isNotBlank(); }
    private void assertCreateCounts(Long diagnosisId, String eventType, long expected) { assertThat(events.findAll().stream().filter(e -> diagnosisId.equals(e.getDiagnosisId()) && eventType.equals(e.getEventType())).count()).isEqualTo(expected); assertThat(outbox.findAll().stream().filter(e -> String.valueOf(diagnosisId).equals(e.getAggregateId()) && eventType.equals(e.getEventType())).count()).isEqualTo(expected); }
    private long diagnosisEvents(Long diagnosisId) { return events.findAll().stream().filter(e -> diagnosisId.equals(e.getDiagnosisId())).count(); }
    private long nonCreateDiagnosisEvents(Long diagnosisId) { return events.findAll().stream().filter(e -> diagnosisId.equals(e.getDiagnosisId()) && !"DIAGNOSIS_CREATED".equals(e.getEventType())).count(); }
    private long quoteCount(ServiceOrder order) { return quotes.findAll().stream().filter(q -> q.getServiceOrder().getId().equals(order.getId())).count(); }
    private void assertConflict(Throwing action) { assertThatThrownBy(action::run).isInstanceOf(ResponseStatusException.class).extracting("statusCode.value").isEqualTo(409); }
    private int mapperHash(DiagnosisDraftRequest request) { try { return new com.fasterxml.jackson.databind.ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule()).writeValueAsString(request).hashCode(); } catch (Exception e) { throw new AssertionError(e); } }
    private void addEvidence(Fixture f, Long diagnosisId, String key) { MultipartFile file = new MockMultipartFile("file", "evidence.jpg", "image/jpeg", new byte[]{4, 5, 6}); as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), diagnosisId, file, key)); }
    private Fixture fixture() { User customer = user(Role.CUSTOMER, "customer"); User plumber = user(Role.PLUMBER, "plumber"); ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber).requestType(RequestType.NEARBY_AUTO).description("success matrix").build()); order.setStatus(OrderStatus.IN_PROGRESS); order.setArrivedAt(LocalDateTime.now()); order = orders.saveAndFlush(order); return new Fixture(order, plumber); }
    private User user(Role role, String prefix) { return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x").fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build()); }
    private DiagnosisDraftRequest request(String narrative) { return new DiagnosisDraftRequest("pipe", "condition", narrative, "repair", new BigDecimal("1.00"), "washer", "none", false); }
    private DiagnosisDraftUpdateRequest update(String narrative, Long version) { return new DiagnosisDraftUpdateRequest("pipe", "condition", narrative, "repair", new BigDecimal("1.00"), "washer", "none", false, version); }
    private <T> T as(User actor, Callable<T> action) { var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(new UsernamePasswordAuthenticationToken(actor.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + actor.getRole())))); SecurityContextHolder.setContext(context); try { return action.call(); } catch (Exception e) { if (e instanceof RuntimeException r) throw r; throw new RuntimeException(e); } finally { SecurityContextHolder.clearContext(); } }

    private record Fixture(ServiceOrder order, User plumber) {}
    private record CreateCase(ServiceOrder order, User plumber, DiagnosisDraftRequest body, PlumberDiagnosisResponse response, String key) {}
    private record UpdateCase(ServiceOrder order, User plumber, DiagnosisDraftUpdateRequest body, PlumberDiagnosisResponse response, String key) {}
    private record SubmitCase(ServiceOrder order, User plumber, PlumberDiagnosisResponse response, String key) {}
    private record RevisionCase(ServiceOrder order, User plumber, ServiceDiagnosis original, PlumberDiagnosisResponse replacement, DiagnosisDraftRequest body, String key) {}
    private record CancelCase(ServiceOrder order, User operations, ServiceDiagnosis diagnosis, String key) {}
    private record EvidenceCase(ServiceOrder order, User plumber, ServiceDiagnosis diagnosis, MultipartFile file, String key) {}
    @FunctionalInterface private interface Throwing { void run() throws Exception; }
}
