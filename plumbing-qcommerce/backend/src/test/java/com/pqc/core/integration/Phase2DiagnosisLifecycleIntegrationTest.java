package com.pqc.core.integration;

import com.pqc.core.config.Phase2Properties;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.ServiceDiagnosisService;
import com.pqc.core.service.ServiceOrderService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.flywaydb.core.Flyway;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;

/** End-to-end diagnosis proof on the production PostgreSQL dialect. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2DiagnosisLifecycleIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_diagnosis_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(URL, USER, PASSWORD));
        admin.execute("CREATE SCHEMA " + SCHEMA);
        Flyway.configure().dataSource(URL, USER, PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA)
                .locations("classpath:db/migration").load().migrate();
        registry.add("spring.datasource.url", () -> URL + (URL.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        registry.add("spring.datasource.username", () -> USER);
        registry.add("spring.datasource.password", () -> PASSWORD);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> false);
        registry.add("phase2-diagnosis-quotes.enabled", () -> true);
        registry.add("app.photos.storage-dir", () -> "target/phase2-diagnosis-test-photos");
    }

    @Autowired ServiceDiagnosisService diagnosis;
    @Autowired ServiceOrderService orderService;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired ServiceDiagnosisRepository diagnoses;
    @Autowired ServiceDiagnosisEvidenceRepository evidence;
    @Autowired Phase2EnrollmentRepository enrollments;
    @Autowired Phase2IdempotencyKeyRepository idempotency;
    @Autowired ServiceQuoteEventRepository events;
    @Autowired OutboxEventRepository outbox;
    @Autowired ServiceQuoteRepository quotes;
    @Autowired TransactionTemplate tx;
    @Autowired Phase2Properties properties;

    @AfterEach void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test
    void createReplayConflictAndEventCardinality() {
        Fixture f = fixture(); DiagnosisDraftRequest body = request("initial");
        PlumberDiagnosisResponse first = as(f.plumber, () -> diagnosis.create(f.order.getId(), body, "create-1"));
        PlumberDiagnosisResponse replay = as(f.plumber, () -> diagnosis.create(f.order.getId(), body, "create-1"));
        assertThat(replay.id()).isEqualTo(first.id());
        assertThat(enrollments.findByServiceOrderId(f.order.getId())).isPresent();
        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).hasSize(1);
        assertThat(events.findByIdempotencyKeyIdAndEventType(idempotency.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(f.plumber.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", f.order.getId(), "create-1").orElseThrow().getId(), "DIAGNOSIS_CREATED")).isPresent();
        assertThat(outbox.findAll().stream().filter(e -> e.getAggregateId().equals(String.valueOf(f.order.getId())) && e.getEventType().equals("DIAGNOSIS_CREATED")).count()).isEqualTo(1);
        assertThatThrownBy(() -> as(f.plumber, () -> diagnosis.create(f.order.getId(), request("different"), "create-1")))
                .isInstanceOf(RuntimeException.class);
        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).hasSize(1);
    }

    @Test
    void concurrentCreateHasOneEnrollmentAndDiagnosis() throws Exception {
        for (int run = 0; run < 3; run++) {
            Fixture f = fixture();
            final String key = "race-" + run;
            ExecutorService pool = Executors.newFixedThreadPool(2);
            CountDownLatch start = new CountDownLatch(1);
            Callable<Object> call = () -> { start.await(); try { return as(f.plumber, () -> diagnosis.create(f.order.getId(), request("race"), key)); } catch (Throwable t) { return t; } };
            Future<Object> a = pool.submit(call), b = pool.submit(call); start.countDown();
            Object one = a.get(30, TimeUnit.SECONDS), two = b.get(30, TimeUnit.SECONDS); pool.shutdownNow();
            assertThat(List.of(one, two)).anyMatch(PlumberDiagnosisResponse.class::isInstance);
            assertThat(diagnoses.findByServiceOrderId(f.order.getId()).stream().filter(d -> d.getState() == DiagnosisState.DRAFT).count()).isEqualTo(1);
            assertThat(enrollments.findByServiceOrderId(f.order.getId())).isPresent();
        }
    }

    @Test
    void updateSubmitRevisionAndCancellationLifecycle() {
        Fixture f = fixture();
        PlumberDiagnosisResponse created = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("draft"), "l-create"));
        PlumberDiagnosisResponse updated = as(f.plumber, () -> diagnosis.update(f.order.getId(), created.id(), update("updated", created.version()), "l-update"));
        assertThat(updated.diagnosisNarrative()).isEqualTo("updated");
        assertThatThrownBy(() -> as(f.plumber, () -> diagnosis.submit(f.order.getId(), created.id(), "l-submit"))).isInstanceOf(RuntimeException.class);
        // Evidence is uploaded through the real production photo/link path.
        MultipartFile file = new MockMultipartFile("file", "diagnosis.jpg", "image/jpeg", new byte[]{1, 2, 3});
        DiagnosisEvidenceResponse linked = as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), created.id(), file, "l-evidence"));
        assertThat(linked.id()).isNotNull();
        // The first submit failed and therefore permanently consumed l-submit;
        // a valid retry must use a new idempotency key.
        PlumberDiagnosisResponse submitted = as(f.plumber, () -> diagnosis.submit(f.order.getId(), created.id(), "l-submit-retry"));
        assertThat(submitted.state()).isEqualTo(DiagnosisState.SUBMITTED.name());
        assertThat(quotes.findAll().stream().filter(q -> q.getServiceOrder().getId().equals(f.order.getId())).count()).isEqualTo(1);
        PlumberDiagnosisResponse replacement = as(f.plumber, () -> diagnosis.createRevision(f.order.getId(), created.id(), request("revision"), "l-revision"));
        addEvidenceAndSubmit(f, replacement);
        assertThat(diagnoses.findById(created.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUPERSEDED);
        assertThat(diagnoses.findById(replacement.id()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUBMITTED);
    }

    @Test
    void atomicEnrollmentRollbackLeavesNoRows() {
        Fixture f = fixture();
        long eventsBefore = events.findAll().stream().filter(e -> e.getServiceOrderId().equals(f.order.getId())).count();
        long outboxBefore = outbox.findAll().stream().filter(e -> e.getAggregateId().equals(String.valueOf(f.order.getId()))).count();
        assertThatThrownBy(() -> tx.executeWithoutResult(status -> {
            enrollments.saveAndFlush(Phase2Enrollment.builder().serviceOrderId(f.order.getId()).enabledSnapshot(true).policySnapshot("test").build());
            throw new IllegalStateException("controlled fault");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(enrollments.findByServiceOrderId(f.order.getId())).isEmpty();
        assertThat(diagnoses.findByServiceOrderId(f.order.getId())).isEmpty();
        assertThat(events.findAll().stream().filter(e -> e.getServiceOrderId().equals(f.order.getId())).count()).isEqualTo(eventsBefore);
        assertThat(outbox.findAll().stream().filter(e -> e.getAggregateId().equals(String.valueOf(f.order.getId()))).count()).isEqualTo(outboxBefore);
    }

    @Test
    void updateVsSubmitRaceHasLegalFinalState() throws Exception {
        Fixture f = fixture(); PlumberDiagnosisResponse created = as(f.plumber, () -> diagnosis.create(f.order.getId(), request("race"), "r-create"));
        addEvidence(f, created.id());
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch start = new CountDownLatch(1);
        Future<Object> update = pool.submit(() -> { start.await(); try { return as(f.plumber, () -> diagnosis.update(f.order.getId(), created.id(), update("race-update", created.version()), "r-update")); } catch (Throwable t) { return t; } });
        Future<Object> submit = pool.submit(() -> { start.await(); try { return as(f.plumber, () -> diagnosis.submit(f.order.getId(), created.id(), "r-submit")); } catch (Throwable t) { return t; } });
        start.countDown(); Object a = update.get(30, TimeUnit.SECONDS), b = submit.get(30, TimeUnit.SECONDS); pool.shutdownNow();
        assertThat(List.of(a, b)).allMatch(x -> x instanceof PlumberDiagnosisResponse || x instanceof RuntimeException);
        assertThat(diagnoses.findById(created.id()).orElseThrow().getState()).isIn(DiagnosisState.DRAFT, DiagnosisState.SUBMITTED);
    }

    private void addEvidenceAndSubmit(Fixture f, PlumberDiagnosisResponse d) { addEvidence(f, d.id()); as(f.plumber, () -> diagnosis.submit(f.order.getId(), d.id(), "submit-" + d.id())); }
    private void addEvidence(Fixture f, Long diagnosisId) { MultipartFile file = new MockMultipartFile("file", "diagnosis.jpg", "image/jpeg", new byte[]{4, 5, 6}); as(f.plumber, () -> diagnosis.linkEvidence(f.order.getId(), diagnosisId, file, "evidence-" + diagnosisId)); }
    private DiagnosisDraftRequest request(String narrative) { return new DiagnosisDraftRequest("pipe", "condition", narrative, "repair", new BigDecimal("1.00"), "washer", "none", false); }
    private DiagnosisDraftUpdateRequest update(String narrative, Long version) { return new DiagnosisDraftUpdateRequest("pipe", "condition", narrative, "repair", new BigDecimal("1.00"), "washer", "none", false, version); }

    private Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer"); User plumber = user(Role.PLUMBER, "plumber");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber).requestType(RequestType.NEARBY_AUTO).description("diagnosis test").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        order = orders.saveAndFlush(order);
        return new Fixture(order, plumber, customer);
    }
    private User user(Role role, String prefix) { return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x").fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build()); }
    private <T> T as(User user, Callable<T> action) { var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())))); SecurityContextHolder.setContext(context); try { return action.call(); } catch (Exception e) { if (e.getCause() instanceof RuntimeException r) throw r; throw new RuntimeException(e); } finally { SecurityContextHolder.clearContext(); } }
    private record Fixture(ServiceOrder order, User plumber, User customer) {}
}
