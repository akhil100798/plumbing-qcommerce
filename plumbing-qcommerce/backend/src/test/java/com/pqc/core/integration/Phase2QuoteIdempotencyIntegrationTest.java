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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Real PostgreSQL certification of quote command idempotency and event atomicity. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2QuoteIdempotencyIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_quote_idem_" + UUID.randomUUID().toString().replace("-", "");

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
        registry.add("app.photos.storage-dir", () -> "target/phase2-quote-idempotency-photos");
    }

    @Autowired Phase2QuoteService quoteService;
    @Autowired ServiceDiagnosisService diagnosisService;
    @Autowired ServiceOrderRepository orders;
    @Autowired UserRepository users;
    @Autowired ServiceQuoteRepository quotes;
    @Autowired ServiceQuoteLineRepository lines;
    @Autowired ServicePricingCatalogMutationRepository catalogMutations;
    @Autowired ServicePricingCatalogLineMutationRepository catalogLineMutations;
    @Autowired Phase2IdempotencyKeyRepository idem;
    @Autowired Phase2IdempotencyService idempotency;
    @Autowired PaymentOperationRepository paymentOperations;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate jdbc;

    @AfterEach void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test
    void updateDraftSuccessReplayConflictFailureReplayAndNewKeyRetry() {
        Fixture f = fixture();
        ServiceQuote q = submittedDraft(f);
        Catalog c = catalog("UPDATE");
        QuoteDraftUpdateRequest valid = new QuoteDraftUpdateRequest(c.lineId, new BigDecimal("2.00"));
        PlumberQuoteResponse first = as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), q.getId(), valid, "update-success"));
        Phase2IdempotencyKey row = completed(f.plumber, "UPDATE_QUOTE", q, "update-success");
        String storedResponse = row.getResponsePayload();
        assertThat(storedResponse).contains("\"id\":" + q.getId());
        assertThat(lines.findByQuoteIdOrderByIdAsc(q.getId())).singleElement().satisfies(line -> {
            assertThat(line.getUnitPrice()).isEqualByComparingTo("125.50");
            assertThat(line.getLineTotal()).isEqualByComparingTo("251.00");
        });
        assertThat(quotes.findById(q.getId()).orElseThrow().getAmount()).isEqualByComparingTo("251.00");
        assertThat(quoteEventCount(q.getId())).isZero();

        PlumberQuoteResponse replay = as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), q.getId(), valid, "update-success"));
        assertThat(replay).isEqualTo(first);
        assertThat(completed(f.plumber, "UPDATE_QUOTE", q, "update-success").getResponsePayload()).isEqualTo(storedResponse);
        assertThat(lines.findByQuoteIdOrderByIdAsc(q.getId())).hasSize(1);
        assertThat(outboxCount(q.getId())).isZero();
        assertConflict(f.plumber, () -> quoteService.updateDraft(f.order.getId(), q.getId(), new QuoteDraftUpdateRequest(c.lineId, new BigDecimal("3.00")), "update-success"), "payload conflict");
        assertThat(quotes.findById(q.getId()).orElseThrow().getAmount()).isEqualByComparingTo("251.00");
        assertThat(quoteEventCount(q.getId())).isZero();
        assertThat(outboxCount(q.getId())).isZero();

        QuoteDraftUpdateRequest bad = new QuoteDraftUpdateRequest(Long.MAX_VALUE, BigDecimal.ONE);
        assertFailure(f.plumber, () -> quoteService.updateDraft(f.order.getId(), q.getId(), bad, "update-failure"), 404);
        assertFailed(f.plumber, "UPDATE_QUOTE", q, "update-failure");
        assertFailure(f.plumber, () -> quoteService.updateDraft(f.order.getId(), q.getId(), bad, "update-failure"), 404);
        assertThat(quotes.findById(q.getId()).orElseThrow().getAmount()).isEqualByComparingTo("251.00");
        assertThat(as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), q.getId(), valid, "update-retry")).total()).isEqualByComparingTo("251.00");
        assertThat(completed(f.plumber, "UPDATE_QUOTE", q, "update-retry").getStatus()).isEqualTo(Phase2IdempotencyStatus.COMPLETED);
    }

    @Test
    void publishSuccessReplayConflictFailureReplayAndNewKeyRetry() {
        Fixture f = fixture();
        ServiceQuote q = submittedDraft(f);
        Catalog c = catalog("PUBLISH");
        QuotePublishRequest request = new QuotePublishRequest(c.catalogId, 24);
        PlumberQuoteResponse first = as(f.plumber, () -> quoteService.publish(f.order.getId(), q.getId(), request, "publish-success"));
        assertThat(first.state()).isEqualTo(QuoteState.PUBLISHED.name());
        assertThat(first.publishedAt()).isNotNull();
        assertThat(first.expiresAt()).isAfter(first.publishedAt());
        assertThat(completed(f.plumber, "PUBLISH_QUOTE", q, "publish-success").getResponsePayload()).isNotBlank();
        assertEventOutbox(q.getId(), "QUOTE_PUBLISHED", 1, 1);
        PlumberQuoteResponse replay = as(f.plumber, () -> quoteService.publish(f.order.getId(), q.getId(), request, "publish-success"));
        assertThat(replay).isEqualTo(first);
        assertEventOutbox(q.getId(), "QUOTE_PUBLISHED", 1, 1);
        assertConflict(f.plumber, () -> quoteService.publish(f.order.getId(), q.getId(), new QuotePublishRequest(c.catalogId + 100000, 24), "publish-success"), "payload conflict");
        assertThat(quotes.findById(q.getId()).orElseThrow().getState()).isEqualTo(QuoteState.PUBLISHED);
        assertEventOutbox(q.getId(), "QUOTE_PUBLISHED", 1, 1);

        Fixture retryFixture = fixture();
        ServiceQuote retryQuote = submittedDraft(retryFixture);
        QuotePublishRequest bad = new QuotePublishRequest(Long.MAX_VALUE, 24);
        assertFailure(retryFixture.plumber, () -> quoteService.publish(retryFixture.order.getId(), retryQuote.getId(), bad, "publish-failure"), 409);
        assertFailed(retryFixture.plumber, "PUBLISH_QUOTE", retryQuote, "publish-failure");
        assertFailure(retryFixture.plumber, () -> quoteService.publish(retryFixture.order.getId(), retryQuote.getId(), bad, "publish-failure"), 409);
        assertThat(quotes.findById(retryQuote.getId()).orElseThrow().getState()).isEqualTo(QuoteState.DRAFT);
        assertEventOutbox(retryQuote.getId(), "QUOTE_PUBLISHED", 0, 0);
        Catalog retryCatalog = catalog("PUBLISH-RETRY");
        assertThat(as(retryFixture.plumber, () -> quoteService.publish(retryFixture.order.getId(), retryQuote.getId(), new QuotePublishRequest(retryCatalog.catalogId, 24), "publish-retry")).state()).isEqualTo(QuoteState.PUBLISHED.name());
        assertEventOutbox(retryQuote.getId(), "QUOTE_PUBLISHED", 1, 1);
    }

    @Test
    void approveSuccessReplayFingerprintConflictFailureReplayAndNewKeyRetry() {
        Fixture f = fixture();
        ServiceQuote q = publishFresh(f, "approve-setup");
        CustomerQuoteResponse first = as(f.customer, () -> quoteService.approve(f.order.getId(), q.getId(), "approve-success"));
        assertThat(first.state()).isEqualTo(QuoteState.APPROVED.name());
        assertThat(completed(f.customer, "APPROVE_QUOTE", q, "approve-success").getResponsePayload()).isNotBlank();
        assertEventOutbox(q.getId(), "QUOTE_APPROVED", 1, 1);
        CustomerQuoteResponse replay = as(f.customer, () -> quoteService.approve(f.order.getId(), q.getId(), "approve-success"));
        assertThat(replay).isEqualTo(first);
        assertEventOutbox(q.getId(), "QUOTE_APPROVED", 1, 1);
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();

        // Approval has no request body; the implementation fingerprint is exactly "approve:<quoteId>".
        // Change only the persisted fingerprint to exercise the shared mismatch guard without inventing input.
        jdbc.update("UPDATE phase2_idempotency_keys SET request_fingerprint = ? WHERE id = ?", "approve:" + q.getId() + ":different", completed(f.customer, "APPROVE_QUOTE", q, "approve-success").getId());
        assertConflict(f.customer, () -> quoteService.approve(f.order.getId(), q.getId(), "approve-success"), "payload conflict");
        assertThat(quotes.findById(q.getId()).orElseThrow().getState()).isEqualTo(QuoteState.APPROVED);
        assertEventOutbox(q.getId(), "QUOTE_APPROVED", 1, 1);

        Fixture failed = fixture();
        ServiceQuote failedQuote = publishFresh(failed, "approve-fail-setup");
        assertFailure(failed.otherCustomer, () -> quoteService.approve(failed.order.getId(), failedQuote.getId(), "approve-failure"), 403);
        assertFailed(failed.otherCustomer, "APPROVE_QUOTE", failedQuote, "approve-failure");
        assertFailure(failed.otherCustomer, () -> quoteService.approve(failed.order.getId(), failedQuote.getId(), "approve-failure"), 403);
        assertEventOutbox(failedQuote.getId(), "QUOTE_APPROVED", 0, 0);
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(failed.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
        tx.executeWithoutResult(status -> {
            ServiceOrder order = orders.findById(failed.order.getId()).orElseThrow();
            order.setCustomer(failed.otherCustomer);
            orders.saveAndFlush(order);
        });
        assertThat(as(failed.otherCustomer, () -> quoteService.approve(failed.order.getId(), failedQuote.getId(), "approve-retry")).state()).isEqualTo(QuoteState.APPROVED.name());
        assertEventOutbox(failedQuote.getId(), "QUOTE_APPROVED", 1, 1);
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(failed.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
    }

    @Test
    void rejectSuccessReplayFingerprintConflictFailureReplayAndNewKeyRetry() {
        Fixture f = fixture();
        ServiceQuote q = publishFresh(f, "reject-setup");
        QuoteRejectRequest request = new QuoteRejectRequest("Declined after review");
        CustomerQuoteResponse first = as(f.customer, () -> quoteService.reject(f.order.getId(), q.getId(), request, "reject-success"));
        assertThat(first.state()).isEqualTo(QuoteState.REJECTED.name());
        assertThat(completed(f.customer, "REJECT_QUOTE", q, "reject-success").getResponsePayload()).isNotBlank();
        assertEventOutbox(q.getId(), "QUOTE_REJECTED", 1, 1);
        assertThat(as(f.customer, () -> quoteService.reject(f.order.getId(), q.getId(), request, "reject-success"))).isEqualTo(first);
        assertEventOutbox(q.getId(), "QUOTE_REJECTED", 1, 1);
        assertConflict(f.customer, () -> quoteService.reject(f.order.getId(), q.getId(), new QuoteRejectRequest("Different reason"), "reject-success"), "payload conflict");
        assertThat(quotes.findById(q.getId()).orElseThrow().getDecisionReason()).isEqualTo("Declined after review");
        assertEventOutbox(q.getId(), "QUOTE_REJECTED", 1, 1);

        Fixture failed = fixture();
        ServiceQuote failedQuote = publishFresh(failed, "reject-fail-setup");
        QuoteRejectRequest failRequest = new QuoteRejectRequest("Not authorized yet");
        assertFailure(failed.otherCustomer, () -> quoteService.reject(failed.order.getId(), failedQuote.getId(), failRequest, "reject-failure"), 403);
        assertFailed(failed.otherCustomer, "REJECT_QUOTE", failedQuote, "reject-failure");
        assertFailure(failed.otherCustomer, () -> quoteService.reject(failed.order.getId(), failedQuote.getId(), failRequest, "reject-failure"), 403);
        assertEventOutbox(failedQuote.getId(), "QUOTE_REJECTED", 0, 0);
        tx.executeWithoutResult(status -> {
            ServiceOrder order = orders.findById(failed.order.getId()).orElseThrow();
            order.setCustomer(failed.otherCustomer);
            orders.saveAndFlush(order);
        });
        assertThat(as(failed.otherCustomer, () -> quoteService.reject(failed.order.getId(), failedQuote.getId(), failRequest, "reject-retry")).state()).isEqualTo(QuoteState.REJECTED.name());
        assertEventOutbox(failedQuote.getId(), "QUOTE_REJECTED", 1, 1);
    }

    @Test
    void createRevisionSuccessReplayConflictFailureReplayAndNewKeyRetry() {
        Fixture f = fixture();
        ServiceQuote initial = publishFresh(f, "revision-setup");
        QuoteRevisionRequest request = new QuoteRevisionRequest("Clarify the scope");
        PlumberQuoteResponse first = as(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), request, "revision-success"));
        assertThat(first.state()).isEqualTo(QuoteState.DRAFT.name());
        ServiceQuote revision = quotes.findById(first.id()).orElseThrow();
        assertThat(revision.getQuoteKind()).isEqualTo(QuoteKind.REVISION);
        assertThat(revision.getBaseQuote().getId()).isEqualTo(initial.getId());
        assertThat(revision.getSupersedesQuote().getId()).isEqualTo(initial.getId());
        assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId())).filteredOn(x -> x.getQuoteKind() == QuoteKind.REVISION).hasSize(1);
        assertThat(completed(f.plumber, "CREATE_QUOTE_REVISION", initial, "revision-success").getResponsePayload()).isNotBlank();
        assertThat(as(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), request, "revision-success")).id()).isEqualTo(first.id());
        assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId())).filteredOn(x -> x.getQuoteKind() == QuoteKind.REVISION).hasSize(1);
        assertConflict(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), new QuoteRevisionRequest("Changed revision request"), "revision-success"), "payload conflict");
        assertThat(quoteEventCount(initial.getId())).isEqualTo(1); // setup publication only; revision creation emits no event.
        assertThat(outboxCount(initial.getId())).isEqualTo(1);
        assertThat(quoteEventCount(revision.getId())).isZero();
        assertThat(outboxCount(revision.getId())).isZero();

        Fixture failed = fixture();
        ServiceQuote draft = submittedDraft(failed);
        QuoteRevisionRequest failRequest = new QuoteRevisionRequest("Too early");
        assertFailure(failed.plumber, () -> quoteService.revise(failed.order.getId(), draft.getId(), failRequest, "revision-failure"), 409);
        assertFailed(failed.plumber, "CREATE_QUOTE_REVISION", draft, "revision-failure");
        assertFailure(failed.plumber, () -> quoteService.revise(failed.order.getId(), draft.getId(), failRequest, "revision-failure"), 409);
        assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(failed.order.getId())).filteredOn(x -> x.getQuoteKind() == QuoteKind.REVISION).isEmpty();
        Catalog c = catalog("REVISION-RETRY");
        as(failed.plumber, () -> quoteService.publish(failed.order.getId(), draft.getId(), new QuotePublishRequest(c.catalogId, 24), "revision-fail-repair-publish"));
        PlumberQuoteResponse retried = as(failed.plumber, () -> quoteService.revise(failed.order.getId(), draft.getId(), failRequest, "revision-retry"));
        assertThat(retried.state()).isEqualTo(QuoteState.DRAFT.name());
        assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(failed.order.getId())).filteredOn(x -> x.getQuoteKind() == QuoteKind.REVISION).hasSize(1);
    }

    @Test
    void committedInProgressClaimRejectsRetryWithoutRunningQuoteCommand() {
        Fixture f = fixture();
        ServiceQuote q = submittedDraft(f);
        Catalog c = catalog("INPROGRESS");
        jdbc.update("INSERT INTO phase2_idempotency_keys (actor_id, operation, resource_type, resource_id, idempotency_key, request_fingerprint, status, created_at, updated_at) VALUES (?, 'PUBLISH_QUOTE', 'QUOTE', ?, 'publish-in-progress', ?, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                f.plumber.getId(), q.getId(), "publish:" + q.getId() + ":" + c.catalogId);
        assertFailureOnFreshThread(f.plumber, () -> quoteService.publish(f.order.getId(), q.getId(), new QuotePublishRequest(c.catalogId, 24), "publish-in-progress"), 409, "OPERATION_IN_PROGRESS");
        assertThat(quotes.findById(q.getId()).orElseThrow().getState()).isEqualTo(QuoteState.DRAFT);
        assertEventOutbox(q.getId(), "QUOTE_PUBLISHED", 0, 0);
        assertThat(idem.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(f.plumber.getId(), "PUBLISH_QUOTE", "QUOTE", q.getId(), "publish-in-progress").orElseThrow().getStatus()).isEqualTo(Phase2IdempotencyStatus.IN_PROGRESS);
    }

    private ServiceQuote publishFresh(Fixture f, String prefix) {
        ServiceQuote q = submittedDraft(f);
        Catalog c = catalog(prefix);
        as(f.plumber, () -> quoteService.publish(f.order.getId(), q.getId(), new QuotePublishRequest(c.catalogId, 24), prefix + "-publish"));
        return q;
    }

    private Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer");
        User other = user(Role.CUSTOMER, "other");
        User plumber = user(Role.PLUMBER, "plumber");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber)
                .requestType(RequestType.NEARBY_AUTO).description("quote idempotency certification").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        order = orders.saveAndFlush(order);
        return new Fixture(order, plumber, customer, other);
    }

    private ServiceQuote submittedDraft(Fixture f) {
        PlumberDiagnosisResponse draft = as(f.plumber, () -> diagnosisService.create(f.order.getId(), diagnosisRequest(), "diag-" + UUID.randomUUID()));
        as(f.plumber, () -> diagnosisService.linkEvidence(f.order.getId(), draft.id(), new MockMultipartFile("file", "diagnosis.jpg", "image/jpeg", new byte[]{1, 2, 3}), "evidence-" + UUID.randomUUID()));
        as(f.plumber, () -> diagnosisService.submit(f.order.getId(), draft.id(), "submit-" + UUID.randomUUID()));
        return quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId()).get(0);
    }

    private Catalog catalog(String prefix) {
        ServicePricingCatalog catalog = tx.execute(status -> catalogMutations.saveAndFlush(ServicePricingCatalog.builder()
                .catalogKey(prefix + "-" + UUID.randomUUID()).currency("INR").version(7).status("ACTIVE")
                .effectiveFrom(LocalDateTime.now().minusDays(1)).build()));
        ServicePricingCatalogLine line = tx.execute(status -> catalogLineMutations.save(ServicePricingCatalogLine.builder()
                .pricingCatalogId(catalog.getId()).lineKey("LABOR").lineType("LABOR").amount(new BigDecimal("125.50"))
                .unit("HOUR").minQuantity(new BigDecimal("0.01")).maxQuantity(new BigDecimal("100.00")).build()));
        return new Catalog(catalog.getId(), line.getId());
    }

    private User user(Role role, String prefix) {
        return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x")
                .fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build());
    }

    private DiagnosisDraftRequest diagnosisRequest() {
        return new DiagnosisDraftRequest("pipe", "leaking", "leak observed", "repair joint", new BigDecimal("1.00"), "joint", null, false);
    }

    private Phase2IdempotencyKey completed(User actor, String operation, ServiceQuote q, String key) {
        Phase2IdempotencyKey row = idem.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), operation, "QUOTE", q.getId(), key).orElseThrow();
        assertThat(row.getStatus()).isEqualTo(Phase2IdempotencyStatus.COMPLETED);
        return row;
    }

    private void assertFailed(User actor, String operation, ServiceQuote q, String key) {
        Phase2IdempotencyKey row = idem.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), operation, "QUOTE", q.getId(), key).orElseThrow();
        assertThat(row.getStatus()).isEqualTo(Phase2IdempotencyStatus.FAILED);
        assertThat(row.getResponsePayload()).matches("[0-9]{3}\\|[^\\r\\n]+");
        assertThat(row.getResponsePayload()).doesNotContain("Exception", "SQLException", " at ", "SELECT ", "INSERT ", "\\", "password", "jdbc:");
    }

    private long quoteEventCount(Long quoteId) {
        return jdbc.queryForObject("SELECT count(*) FROM service_quote_events WHERE quote_id = ?", Long.class, quoteId);
    }

    private long outboxCount(Long quoteId) {
        return jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE aggregate_type = 'QUOTE' AND aggregate_id = ?", Long.class, String.valueOf(quoteId));
    }

    private void assertEventOutbox(Long quoteId, String type, long events, long outboxRows) {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_events WHERE quote_id = ? AND event_type = ?", Long.class, quoteId, type)).isEqualTo(events);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE aggregate_type = 'QUOTE' AND aggregate_id = ? AND event_type = ?", Long.class, String.valueOf(quoteId), type)).isEqualTo(outboxRows);
    }

    private void assertConflict(User actor, Callable<?> action, String reason) {
        assertFailure(actor, action, 409, reason);
    }

    private void assertFailure(User actor, Callable<?> action, int status) { assertFailure(actor, action, status, null); }

    private void assertFailure(User actor, Callable<?> action, int status, String reason) {
        Throwable thrown = org.assertj.core.api.Assertions.catchThrowable(() -> as(actor, action));
        assertThat(thrown).isNotNull();
        if (thrown instanceof ResponseStatusException ex) {
            assertThat(ex.getStatusCode().value()).isEqualTo(status);
            if (reason != null) assertThat(ex.getReason()).contains(reason);
        } else if (thrown instanceof org.springframework.security.access.AccessDeniedException) {
            assertThat(status).isEqualTo(403);
        } else {
            throw new AssertionError("Unexpected quote command failure type: " + thrown.getClass().getName(), thrown);
        }
    }

    private void assertFailureOnFreshThread(User actor, Callable<?> action, int status, String reason) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Throwable thrown = executor.submit(() -> {
                try { as(actor, action); return null; }
                catch (Throwable failure) { return failure; }
            }).get();
            assertThat(thrown).isInstanceOf(ResponseStatusException.class);
            ResponseStatusException ex = (ResponseStatusException) thrown;
            assertThat(ex.getStatusCode().value()).isEqualTo(status);
            if (reason != null) assertThat(ex.getReason()).contains(reason);
        } catch (Exception e) {
            throw new AssertionError("Fresh-thread quote retry failed", e);
        } finally {
            executor.shutdownNow();
        }
    }

    private <T> T as(User user, Callable<T> action) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))));
        SecurityContextHolder.setContext(context);
        try { return action.call(); }
        catch (Exception e) { if (e instanceof RuntimeException r) throw r; throw new RuntimeException(e); }
        finally { SecurityContextHolder.clearContext(); }
    }

    private record Fixture(ServiceOrder order, User plumber, User customer, User otherCustomer) {}
    private record Catalog(Long catalogId, Long lineId) {}
}
