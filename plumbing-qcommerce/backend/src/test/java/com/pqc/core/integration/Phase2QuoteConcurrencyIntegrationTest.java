package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
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
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/** Production-service quote state-machine race certification against real PostgreSQL. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2QuoteConcurrencyIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_quote_races_" + UUID.randomUUID().toString().replace("-", "");
    private static final int REPEATS = 3;
    private static final long FUTURE_SECONDS = 15;

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
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> 4);
        registry.add("spring.datasource.hikari.minimum-idle", () -> 0);
        registry.add("spring.datasource.hikari.connection-timeout", () -> 30000);
        registry.add("spring.datasource.hikari.idle-timeout", () -> 600000);
        registry.add("spring.datasource.hikari.max-lifetime", () -> 1800000);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> false);
        registry.add("phase2-diagnosis-quotes.enabled", () -> true);
        registry.add("app.photos.storage-dir", () -> "target/phase2-quote-concurrency-photos");
    }

    @Autowired Phase2QuoteService quoteService;
    @Autowired ServiceDiagnosisService diagnosisService;
    @Autowired ServiceOrderRepository orders;
    @Autowired UserRepository users;
    @Autowired ServiceQuoteRepository quotes;
    @Autowired ServiceQuoteLineRepository lines;
    @Autowired ServicePricingCatalogMutationRepository catalogMutations;
    @Autowired ServicePricingCatalogLineMutationRepository catalogLineMutations;
    @Autowired Phase2IdempotencyKeyRepository idempotencyKeys;
    @Autowired PaymentOperationRepository paymentOperations;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate jdbc;

    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test
    void publishVersusPublishHasOneWinnerAcrossThreeIndependentOrders() throws Exception {
        for (int run = 1; run <= REPEATS; run++) {
            final int iteration = run;
            Fixture f = fixture();
            ServiceQuote quote = initialDraft(f);
            Catalog catalog = catalog("PUBLISH-RACE");
            QuotePublishRequest request = new QuotePublishRequest(catalog.catalogId, 24);
            Race race = race(f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), request, "race-publish-a-" + iteration),
                    f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), request, "race-publish-b-" + iteration));
            assertOneSuccessOneConflict(race);
            assertThat(quotes.findById(quote.getId()).orElseThrow().getState()).isEqualTo(QuoteState.PUBLISHED);
            assertEventOutbox(quote.getId(), Map.of("QUOTE_PUBLISHED", 1));
            assertTerminalPair(f.plumber, "PUBLISH_QUOTE", quote.getId(), List.of("race-publish-a-" + iteration, "race-publish-b-" + iteration));
            assertNoInProgress(f.plumber, "PUBLISH_QUOTE", quote.getId());
        }
    }

    @Test
    void approveVersusRejectHasOneDecisionAndNeverCreatesPaymentOperation() throws Exception {
        for (int run = 1; run <= REPEATS; run++) {
            final int iteration = run;
            Fixture f = fixture();
            ServiceQuote quote = publish(f, "DECISION-RACE");
            String approveKey = "race-approve-" + iteration;
            String rejectKey = "race-reject-" + iteration;
            Race race = race(f.customer, () -> quoteService.approve(f.order.getId(), quote.getId(), approveKey),
                    f.customer, () -> quoteService.reject(f.order.getId(), quote.getId(), new QuoteRejectRequest("race reject"), rejectKey));
            assertOneSuccessOneConflict(race);
            QuoteState finalState = quotes.findById(quote.getId()).orElseThrow().getState();
            assertThat(finalState).isIn(QuoteState.APPROVED, QuoteState.REJECTED);
            if (finalState == QuoteState.APPROVED) {
                assertEventOutbox(quote.getId(), Map.of("QUOTE_PUBLISHED", 1, "QUOTE_APPROVED", 1));
            } else {
                assertEventOutbox(quote.getId(), Map.of("QUOTE_PUBLISHED", 1, "QUOTE_REJECTED", 1));
            }
            assertIdempotency(f.customer, "APPROVE_QUOTE", quote.getId(), approveKey, finalState == QuoteState.APPROVED ? "COMPLETED" : "FAILED");
            assertIdempotency(f.customer, "REJECT_QUOTE", quote.getId(), rejectKey, finalState == QuoteState.REJECTED ? "COMPLETED" : "FAILED");
            assertNoInProgress(f.customer, "APPROVE_QUOTE", quote.getId());
            assertNoInProgress(f.customer, "REJECT_QUOTE", quote.getId());
            assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
        }
    }

    @Test
    void approvalVersusLazyExpiryReadHasOneTerminalTransition() throws Exception {
        for (int run = 1; run <= REPEATS; run++) {
            final int iteration = run;
            Fixture f = fixture();
            ServiceQuote quote = publish(f, "EXPIRY-RACE");
            expireAtOrNearNow(quote.getId());
            String approveKey = "race-expiry-approve-" + iteration;
            Race race = race(f.customer, () -> quoteService.approve(f.order.getId(), quote.getId(), approveKey),
                    f.customer, () -> quoteService.current(f.order.getId()));
            QuoteState finalState = quotes.findById(quote.getId()).orElseThrow().getState();
            assertThat(finalState).isIn(QuoteState.APPROVED, QuoteState.EXPIRED);
            if (finalState == QuoteState.APPROVED) {
                assertThat(race.successes()).isEqualTo(2);
                assertEventOutbox(quote.getId(), Map.of("QUOTE_PUBLISHED", 1, "QUOTE_APPROVED", 1));
                assertIdempotency(f.customer, "APPROVE_QUOTE", quote.getId(), approveKey, "COMPLETED");
            } else {
                assertThat(race.successes()).isEqualTo(1);
                assertEventOutbox(quote.getId(), Map.of("QUOTE_PUBLISHED", 1, "QUOTE_EXPIRED", 1));
                assertIdempotency(f.customer, "APPROVE_QUOTE", quote.getId(), approveKey, "FAILED");
            }
            assertNoInProgress(f.customer, "APPROVE_QUOTE", quote.getId());
            assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
        }
    }

    @Test
    void revisionVersusRevisionCreatesExactlyOneV30ValidRevision() throws Exception {
        for (int run = 1; run <= REPEATS; run++) {
            final int iteration = run;
            Fixture f = fixture();
            ServiceQuote initial = publish(f, "REVISION-RACE");
            String firstKey = "race-revision-a-" + iteration;
            String secondKey = "race-revision-b-" + iteration;
            QuoteRevisionRequest request = new QuoteRevisionRequest("concurrent revision");
            Race race = race(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), request, firstKey),
                    f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), request, secondKey));
            assertOneSuccessOneConflict(race);
            List<ServiceQuote> revisions = quotes.findVersions(f.order.getId(), QuoteKind.REVISION);
            assertThat(revisions).hasSize(1);
            ServiceQuote revision = revisions.get(0);
            assertThat(revision.getVersion()).isEqualTo(2);
            assertThat(revision.getState()).isEqualTo(QuoteState.DRAFT);
            assertThat(revision.getBaseQuote().getId()).isEqualTo(initial.getId());
            assertThat(revision.getSupersedesQuote().getId()).isEqualTo(initial.getId());
            assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quotes WHERE service_order_id = ? AND quote_kind = 'REVISION'", Long.class, f.order.getId())).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_events WHERE quote_id = ? AND event_type = 'QUOTE_PUBLISHED'", Long.class, revision.getId())).isZero();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE aggregate_type = 'QUOTE' AND aggregate_id = ?", Long.class, String.valueOf(revision.getId()))).isZero();
            assertEventOutbox(initial.getId(), Map.of("QUOTE_PUBLISHED", 1));
            assertTerminalPair(f.plumber, "CREATE_QUOTE_REVISION", initial.getId(), List.of(firstKey, secondKey));
            assertNoInProgress(f.plumber, "CREATE_QUOTE_REVISION", initial.getId());
        }
    }

    @Test
    void oldApprovalVersusRevisionPublicationHasOneLegalSerialization() throws Exception {
        for (int run = 1; run <= REPEATS; run++) {
            final int iteration = run;
            Fixture f = fixture();
            ServiceQuote initial = publish(f, "OLD-APPROVE-RACE");
            PlumberQuoteResponse revisionResult = as(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), new QuoteRevisionRequest("revision for race"), "race-setup-revision-" + iteration));
            ServiceQuote revision = quotes.findById(revisionResult.id()).orElseThrow();
            Catalog catalog = catalog("REVISION-PUBLISH-RACE");
            String approveKey = "race-old-approve-" + iteration;
            String publishKey = "race-revision-publish-" + iteration;
            Race race = race(f.customer, () -> quoteService.approve(f.order.getId(), initial.getId(), approveKey),
                    f.plumber, () -> quoteService.publish(f.order.getId(), revision.getId(), new QuotePublishRequest(catalog.catalogId, 24), publishKey));
            assertOneSuccessOneConflict(race);
            ServiceQuote oldAfter = quotes.findById(initial.getId()).orElseThrow();
            ServiceQuote revisionAfter = quotes.findById(revision.getId()).orElseThrow();
            List<ServiceQuote> currentRepairQuotes = quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId()).stream()
                    .filter(q -> q.getQuoteKind() == QuoteKind.INITIAL || q.getQuoteKind() == QuoteKind.REVISION)
                    .filter(q -> q.getState() == QuoteState.PUBLISHED || q.getState() == QuoteState.APPROVED).toList();
            assertThat(currentRepairQuotes).hasSize(1);
            if (oldAfter.getState() == QuoteState.APPROVED) {
                assertThat(revisionAfter.getState()).isEqualTo(QuoteState.DRAFT);
                assertThat(idempotencyStatus(f.plumber, "PUBLISH_QUOTE", revision.getId(), publishKey)).isEqualTo("FAILED");
                assertThat(idempotencyStatus(f.customer, "APPROVE_QUOTE", initial.getId(), approveKey)).isEqualTo("COMPLETED");
                assertEventOutbox(initial.getId(), Map.of("QUOTE_PUBLISHED", 1, "QUOTE_APPROVED", 1));
                assertEventOutbox(revision.getId(), Map.of());
            } else {
                assertThat(oldAfter.getState()).isEqualTo(QuoteState.SUPERSEDED);
                assertThat(revisionAfter.getState()).isEqualTo(QuoteState.PUBLISHED);
                assertThat(idempotencyStatus(f.customer, "APPROVE_QUOTE", initial.getId(), approveKey)).isEqualTo("FAILED");
                assertThat(idempotencyStatus(f.plumber, "PUBLISH_QUOTE", revision.getId(), publishKey)).isEqualTo("COMPLETED");
                assertEventOutbox(initial.getId(), Map.of("QUOTE_PUBLISHED", 1, "QUOTE_SUPERSEDED", 1));
                assertEventOutbox(revision.getId(), Map.of("QUOTE_PUBLISHED", 1));
            }
            assertNoInProgress(f.customer, "APPROVE_QUOTE", initial.getId());
            assertNoInProgress(f.plumber, "PUBLISH_QUOTE", revision.getId());
            assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
        }
    }

    private Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer");
        User plumber = user(Role.PLUMBER, "plumber");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber)
                .requestType(RequestType.NEARBY_AUTO).description("quote concurrency certification").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        order = orders.saveAndFlush(order);
        return new Fixture(order, plumber, customer);
    }

    private ServiceQuote initialDraft(Fixture f) {
        PlumberDiagnosisResponse diagnosis = as(f.plumber, () -> diagnosisService.create(f.order.getId(), diagnosisRequest(), "race-diag-" + UUID.randomUUID()));
        as(f.plumber, () -> diagnosisService.linkEvidence(f.order.getId(), diagnosis.id(), new MockMultipartFile("file", "diagnosis.jpg", "image/jpeg", new byte[]{1, 2, 3}), "race-evidence-" + UUID.randomUUID()));
        as(f.plumber, () -> diagnosisService.submit(f.order.getId(), diagnosis.id(), "race-submit-" + UUID.randomUUID()));
        return quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId()).stream().filter(q -> q.getQuoteKind() == QuoteKind.INITIAL).findFirst().orElseThrow();
    }

    private ServiceQuote publish(Fixture f, String prefix) {
        ServiceQuote quote = initialDraft(f);
        Catalog catalog = catalog(prefix);
        as(f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), new QuotePublishRequest(catalog.catalogId, 24), prefix + "-setup-publish-" + UUID.randomUUID()));
        return quote;
    }

    private Catalog catalog(String prefix) {
        ServicePricingCatalog catalog = tx.execute(status -> catalogMutations.saveAndFlush(ServicePricingCatalog.builder()
                .catalogKey(prefix + "-" + UUID.randomUUID()).currency("INR").version(7).status("ACTIVE")
                .effectiveFrom(LocalDateTime.now().minusDays(1)).build()));
        ServicePricingCatalogLine line = tx.execute(status -> catalogLineMutations.save(ServicePricingCatalogLine.builder()
                .pricingCatalogId(catalog.getId()).lineKey("LABOR").lineType("LABOR").amount(new BigDecimal("100.00"))
                .unit("HOUR").minQuantity(new BigDecimal("0.01")).maxQuantity(new BigDecimal("100.00")).build()));
        return new Catalog(catalog.getId(), line.getId());
    }

    private void expireAtOrNearNow(Long quoteId) {
        tx.executeWithoutResult(status -> {
            ServiceQuote q = quotes.findByIdForUpdate(quoteId).orElseThrow();
            q.setPublishedAt(LocalDateTime.now().minusMinutes(1));
            q.setExpiresAt(LocalDateTime.now().minusNanos(1));
            quotes.saveAndFlush(q);
        });
    }

    private DiagnosisDraftRequest diagnosisRequest() {
        return new DiagnosisDraftRequest("pipe", "leaking", "leak observed", "repair joint", new BigDecimal("1.00"), "joint", null, false);
    }

    private User user(Role role, String prefix) {
        return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x")
                .fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build());
    }

    private Race race(User leftActor, Callable<?> leftAction, User rightActor, Callable<?> rightAction) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Future<Outcome> left = pool.submit(() -> invoke(leftActor, leftAction, ready, start));
        Future<Outcome> right = pool.submit(() -> invoke(rightActor, rightAction, ready, start));
        try {
            assertThat(ready.await(FUTURE_SECONDS, TimeUnit.SECONDS)).as("both quote race workers become ready").isTrue();
            start.countDown();
            Outcome a = left.get(FUTURE_SECONDS, TimeUnit.SECONDS);
            Outcome b = right.get(FUTURE_SECONDS, TimeUnit.SECONDS);
            return new Race(a, b);
        } catch (TimeoutException timeout) {
            start.countDown();
            left.cancel(true);
            right.cancel(true);
            throw new AssertionError("Quote race exceeded bounded 15-second future", timeout);
        } finally {
            pool.shutdownNow();
            assertThat(pool.awaitTermination(5, TimeUnit.SECONDS)).as("quote race worker pool terminates").isTrue();
        }
    }

    private Outcome invoke(User actor, Callable<?> command, CountDownLatch ready, CountDownLatch start) throws Exception {
        authenticate(actor);
        ready.countDown();
        if (!start.await(FUTURE_SECONDS, TimeUnit.SECONDS)) throw new AssertionError("Quote race start gate timed out");
        try {
            Object result = command.call();
            return new Outcome(true, null, result);
        } catch (Throwable failure) {
            if (isInfrastructureFailure(failure)) throw new AssertionError("Quote race infrastructure failure", failure);
            if (failure instanceof ResponseStatusException || failure instanceof org.springframework.security.access.AccessDeniedException) {
                return new Outcome(false, failure, null);
            }
            throw new AssertionError("Unexpected quote race failure", failure);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private boolean isInfrastructureFailure(Throwable failure) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            String name = t.getClass().getName();
            String message = String.valueOf(t.getMessage()).toLowerCase(Locale.ROOT);
            if (name.contains("PessimisticLock") || name.contains("CannotAcquireLock")
                    || name.contains("OptimisticLock") || name.contains("TransactionSystem")
                    || name.contains("UnexpectedRollback") || name.contains("QueryTimeout")
                    || message.contains("deadlock") || message.contains("lock timeout")
                    || message.contains("timed out") || message.contains("could not serialize")
                    || message.contains("transaction is aborted") || message.contains("rollback-only")) return true;
        }
        return false;
    }

    private void assertOneSuccessOneConflict(Race race) {
        assertThat(race.successes()).as("exactly one command succeeds; competitor is a deterministic domain conflict").isEqualTo(1);
        Outcome loser = race.left().success ? race.right() : race.left();
        assertThat(loser.failure).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) loser.failure).getStatusCode().value()).isEqualTo(409);
    }

    private void assertEventOutbox(Long quoteId, Map<String, Integer> expectedTypes) {
        Map<String, Integer> expected = new HashMap<>(expectedTypes);
        Long eventCount = jdbc.queryForObject("SELECT count(*) FROM service_quote_events WHERE quote_id = ?", Long.class, quoteId);
        Long outboxCount = jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE aggregate_type = 'QUOTE' AND aggregate_id = ?", Long.class, String.valueOf(quoteId));
        assertThat(eventCount).isEqualTo(expected.values().stream().mapToLong(Integer::longValue).sum());
        assertThat(outboxCount).isEqualTo(eventCount);
        List<Map<String, Object>> actual = jdbc.queryForList("SELECT event_type, count(*) AS n FROM service_quote_events WHERE quote_id = ? GROUP BY event_type", quoteId);
        Map<String, Integer> actualTypes = new HashMap<>();
        actual.forEach(row -> actualTypes.put((String) row.get("event_type"), ((Number) row.get("n")).intValue()));
        assertThat(actualTypes).isEqualTo(expected);
        List<Map<String, Object>> outbox = jdbc.queryForList("SELECT event_type, count(*) AS n FROM outbox_events WHERE aggregate_type = 'QUOTE' AND aggregate_id = ? GROUP BY event_type", String.valueOf(quoteId));
        Map<String, Integer> outboxTypes = new HashMap<>();
        outbox.forEach(row -> outboxTypes.put((String) row.get("event_type"), ((Number) row.get("n")).intValue()));
        assertThat(outboxTypes).isEqualTo(expected);
    }

    private void assertTerminalPair(User actor, String operation, Long quoteId, List<String> keys) {
        List<String> states = keys.stream().map(key -> idempotencyStatus(actor, operation, quoteId, key)).toList();
        assertThat(states).containsExactlyInAnyOrder("COMPLETED", "FAILED");
    }

    private String idempotencyStatus(User actor, String operation, Long quoteId, String key) {
        return jdbc.queryForObject("SELECT status FROM phase2_idempotency_keys WHERE actor_id = ? AND operation = ? AND resource_type = 'QUOTE' AND resource_id = ? AND idempotency_key = ?",
                String.class, actor.getId(), operation, quoteId, key);
    }

    private void assertIdempotency(User actor, String operation, Long quoteId, String key, String status) {
        assertThat(idempotencyStatus(actor, operation, quoteId, key)).isEqualTo(status);
    }

    private void assertNoInProgress(User actor, String operation, Long quoteId) {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM phase2_idempotency_keys WHERE actor_id = ? AND operation = ? AND resource_type = 'QUOTE' AND resource_id = ? AND status = 'IN_PROGRESS'",
                Long.class, actor.getId(), operation, quoteId)).isZero();
    }

    private void authenticate(User actor) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(actor.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + actor.getRole().name()))));
        SecurityContextHolder.setContext(context);
    }

    private <T> T as(User actor, Callable<T> action) {
        authenticate(actor);
        try { return action.call(); }
        catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException(e); }
        finally { SecurityContextHolder.clearContext(); }
    }

    private record Fixture(ServiceOrder order, User plumber, User customer) {}
    private record Catalog(Long catalogId, Long lineId) {}
    private record Outcome(boolean success, Throwable failure, Object result) {}
    private record Race(Outcome left, Outcome right) {
        int successes() { return (left.success ? 1 : 0) + (right.success ? 1 : 0); }
    }
}
