package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
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
import org.flywaydb.core.Flyway;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class Phase2QuoteLifecycleIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_quote_lifecycle_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(URL, USER, PASSWORD));
        admin.execute("CREATE SCHEMA " + SCHEMA);
        Flyway.configure().dataSource(URL, USER, PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA).locations("classpath:db/migration").load().migrate();
        registry.add("spring.datasource.url", () -> URL + (URL.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        registry.add("spring.datasource.username", () -> USER);
        registry.add("spring.datasource.password", () -> PASSWORD);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> false);
        registry.add("phase2-diagnosis-quotes.enabled", () -> true);
        registry.add("app.photos.storage-dir", () -> "target/phase2-quote-lifecycle-photos");
    }

    @Autowired Phase2QuoteService quoteService;
    @Autowired ServiceDiagnosisService diagnosisService;
    @Autowired ServiceOrderRepository orders;
    @Autowired UserRepository users;
    @Autowired ServiceQuoteRepository quotes;
    @Autowired ServiceQuoteLineRepository quoteLines;
    @Autowired ServiceQuoteEventRepository quoteEvents;
    @Autowired PaymentOperationRepository paymentOperations;
    @Autowired OutboxEventRepository outbox;
    @Autowired Phase2IdempotencyKeyRepository idem;
    @Autowired ServicePricingCatalogMutationRepository catalogMutations;
    @Autowired ServicePricingCatalogRepository catalogs;
    @Autowired ServicePricingCatalogLineMutationRepository catalogLineMutations;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate jdbc;

    @AfterEach void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test
    void diagnosisCreatesDraftAndQuoteCommandsPersistAuthoritativeSnapshotAndCustomerDecision() {
        Fixture f = fixture();
        PlumberDiagnosisResponse draft = as(f.plumber, () -> diagnosisService.create(f.order.getId(), diagnosisRequest(), "q-diag-create"));
        as(f.plumber, () -> diagnosisService.linkEvidence(f.order.getId(), draft.id(), new MockMultipartFile("file", "diag.jpg", "image/jpeg", new byte[]{1, 2, 3}), "q-diag-evidence"));
        as(f.plumber, () -> diagnosisService.submit(f.order.getId(), draft.id(), "q-diag-submit"));

        List<ServiceQuote> initialQuotes = quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId());
        assertThat(initialQuotes).hasSize(1);
        ServiceQuote quote = initialQuotes.get(0);
        assertThat(quote.getQuoteKind()).isEqualTo(QuoteKind.INITIAL);
        assertThat(quote.getState()).isEqualTo(QuoteState.DRAFT);
        assertThat(quote.getDiagnosis().getId()).isEqualTo(draft.id());
        assertThat(quote.getAmount()).isEqualByComparingTo(BigDecimal.ZERO);

        ServicePricingCatalog catalog = tx.execute(status -> catalogMutations.saveAndFlush(ServicePricingCatalog.builder()
                .catalogKey("TEST-REPAIR").currency("INR").version(7).status("ACTIVE")
                .effectiveFrom(LocalDateTime.now().minusDays(1)).build()));
        ServicePricingCatalogLine catalogLine = tx.execute(status -> catalogLineMutations.save(ServicePricingCatalogLine.builder()
                .pricingCatalogId(catalog.getId()).lineKey("LABOR-REPAIR").lineType("LABOR")
                .amount(new BigDecimal("125.50")).unit("HOUR").minQuantity(new BigDecimal("0.01")).maxQuantity(new BigDecimal("100.00")).build()));

        PlumberQuoteResponse updated = as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), quote.getId(), new QuoteDraftUpdateRequest(catalogLine.getId(), new BigDecimal("2.00")), "q-update"));
        assertThat(updated.total()).isEqualByComparingTo("251.00");
        assertThat(updated.lines()).hasSize(1);
        ServiceQuoteLine storedLine = quoteLines.findByQuoteIdOrderByIdAsc(quote.getId()).get(0);
        assertThat(storedLine.getUnitPrice()).isEqualByComparingTo("125.50");
        assertThat(storedLine.getLineTotal()).isEqualByComparingTo("251.00");

        PlumberQuoteResponse published = as(f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), new QuotePublishRequest(catalog.getId(), 24), "q-publish"));
        assertThat(published.state()).isEqualTo(QuoteState.PUBLISHED.name());
        assertThat(published.publishedAt()).isNotNull();
        assertThat(published.expiresAt()).isAfter(published.publishedAt());
        assertThat(published.total()).isEqualByComparingTo("125.50");
        assertThat(quotes.findById(quote.getId()).orElseThrow().getImmutableSnapshotAt()).isNotNull();
        assertThat(countEvent("QUOTE_PUBLISHED", quote.getId())).isEqualTo(1);
        assertThat(countOutbox("QUOTE_PUBLISHED", quote.getId())).isEqualTo(1);

        CustomerQuoteResponse customerView = as(f.customer, () -> quoteService.current(f.order.getId()));
        assertThat(customerView.state()).isEqualTo(QuoteState.PUBLISHED.name());
        assertThat(customerView.total()).isEqualByComparingTo("125.50");
        assertThatThrownBy(() -> as(f.otherCustomer, () -> quoteService.current(f.order.getId()))).isInstanceOf(RuntimeException.class);

        CustomerQuoteResponse approved = as(f.customer, () -> quoteService.approve(f.order.getId(), quote.getId(), "q-approve"));
        assertThat(approved.state()).isEqualTo(QuoteState.APPROVED.name());
        ServiceQuote decided = quotes.findById(quote.getId()).orElseThrow();
        assertThat(decided.getApprovedAt()).isNotNull();
        assertThat(decided.getDecisionActorId()).isEqualTo(f.customer.getId());
        assertThat(countEvent("QUOTE_APPROVED", quote.getId())).isEqualTo(1);
        assertThat(countOutbox("QUOTE_APPROVED", quote.getId())).isEqualTo(1);
        assertIdemCompleted(f.plumber, "UPDATE_QUOTE", quote.getId(), "q-update");
        assertIdemCompleted(f.plumber, "PUBLISH_QUOTE", quote.getId(), "q-publish");
        assertIdemCompleted(f.customer, "APPROVE_QUOTE", quote.getId(), "q-approve");
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
        assertThat(orders.findById(f.order.getId()).orElseThrow().getStatus()).isNotEqualTo(OrderStatus.PAID);
    }

    @Test
    void plumberCurrentQuoteLookupReturnsDraftAndEnforcesAssignment() {
        Fixture f = fixture();
        assertThatThrownBy(() -> as(f.plumber, () -> quoteService.currentForPlumber(f.order.getId())))
                .isInstanceOf(RuntimeException.class);

        PlumberDiagnosisResponse diagnosis = as(f.plumber, () -> diagnosisService.create(
                f.order.getId(), diagnosisRequest(), "current-quote-diagnosis"));
        as(f.plumber, () -> diagnosisService.linkEvidence(f.order.getId(), diagnosis.id(),
                new MockMultipartFile("file", "diag.jpg", "image/jpeg", new byte[]{1, 2, 3}), "current-quote-evidence"));
        as(f.plumber, () -> diagnosisService.submit(f.order.getId(), diagnosis.id(), "current-quote-submit"));

        ServiceQuote draft = quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId()).get(0);
        PlumberQuoteResponse current = as(f.plumber, () -> quoteService.currentForPlumber(f.order.getId()));
        assertThat(current.id()).isEqualTo(draft.getId());
        assertThat(current.kind()).isEqualTo(QuoteKind.INITIAL.name());
        assertThat(current.state()).isEqualTo(QuoteState.DRAFT.name());

        assertThatThrownBy(() -> as(f.otherCustomer, () -> quoteService.currentForPlumber(f.order.getId())))
                .isInstanceOf(RuntimeException.class);
        User otherPlumber = user(Role.PLUMBER, "unassigned-current-quote");
        assertThatThrownBy(() -> as(otherPlumber, () -> quoteService.currentForPlumber(f.order.getId())))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void rejectionAndLazyExpiryAreTerminalAndEmitExactlyOneTransition() {
        Fixture rejectedFixture = fixture();
        ServiceQuote rejected = submittedDraft(rejectedFixture);
        ServicePricingCatalog rejectedCatalog = catalog("REJECT-CATALOG", "ACTIVE", LocalDateTime.now().minusDays(1), null, "90.00");
        as(rejectedFixture.plumber, () -> quoteService.publish(rejectedFixture.order.getId(), rejected.getId(), new QuotePublishRequest(rejectedCatalog.getId(), 24), "reject-publish"));
        as(rejectedFixture.customer, () -> quoteService.reject(rejectedFixture.order.getId(), rejected.getId(), new QuoteRejectRequest("Declined"), "reject-decision"));
        ServiceQuote rejectedState = quotes.findById(rejected.getId()).orElseThrow();
        assertThat(rejectedState.getState()).isEqualTo(QuoteState.REJECTED);
        assertThat(rejectedState.getRejectedAt()).isNotNull();
        assertThat(rejectedState.getDecisionActorId()).isEqualTo(rejectedFixture.customer.getId());
        assertThat(countEvent("QUOTE_REJECTED", rejected.getId())).isEqualTo(1);
        assertThat(countOutbox("QUOTE_REJECTED", rejected.getId())).isEqualTo(1);

        Fixture expiryFixture = fixture();
        ServiceQuote expired = submittedDraft(expiryFixture);
        ServicePricingCatalog expiryCatalog = catalog("EXPIRY-CATALOG", "ACTIVE", LocalDateTime.now().minusDays(1), null, "80.00");
        as(expiryFixture.plumber, () -> quoteService.publish(expiryFixture.order.getId(), expired.getId(), new QuotePublishRequest(expiryCatalog.getId(), 1), "expiry-publish"));
        tx.executeWithoutResult(status -> {
            ServiceQuote row = quotes.findByIdForUpdate(expired.getId()).orElseThrow();
            row.setPublishedAt(LocalDateTime.now().minusHours(2));
            row.setExpiresAt(LocalDateTime.now().minusMinutes(1));
            quotes.saveAndFlush(row);
        });
        assertThatThrownBy(() -> as(expiryFixture.customer, () -> quoteService.approve(expiryFixture.order.getId(), expired.getId(), "expired-approve"))).isInstanceOf(RuntimeException.class);
        assertThat(quotes.findById(expired.getId()).orElseThrow().getState()).isEqualTo(QuoteState.EXPIRED);
        assertThat(countEvent("QUOTE_EXPIRED", expired.getId())).isEqualTo(1);
        assertThat(countOutbox("QUOTE_EXPIRED", expired.getId())).isEqualTo(1);
        assertThatThrownBy(() -> as(expiryFixture.customer, () -> quoteService.reject(expiryFixture.order.getId(), expired.getId(), new QuoteRejectRequest("late"), "expired-reject"))).isInstanceOf(RuntimeException.class);
        assertThat(countEvent("QUOTE_EXPIRED", expired.getId())).isEqualTo(1);
        assertThat(countOutbox("QUOTE_EXPIRED", expired.getId())).isEqualTo(1);
    }

    @Test
    void singleRevisionSupersedesOriginalAndPreservesApprovalAsRepairOnly() {
        Fixture f = fixture();
        ServiceQuote initial = submittedDraft(f);
        ServicePricingCatalog firstCatalog = catalog("REVISION-INITIAL", "ACTIVE", LocalDateTime.now().minusDays(1), null, "100.00");
        as(f.plumber, () -> quoteService.publish(f.order.getId(), initial.getId(), new QuotePublishRequest(firstCatalog.getId(), 24), "revision-initial-publish"));
        PlumberQuoteResponse revisionResponse = as(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), new QuoteRevisionRequest("Clarify scope"), "revision-create"));
        ServiceQuote revision = quotes.findById(revisionResponse.id()).orElseThrow();
        assertThat(revision.getQuoteKind()).isEqualTo(QuoteKind.REVISION);
        assertThat(revision.getVersion()).isEqualTo(2);
        assertThat(revision.getState()).isEqualTo(QuoteState.DRAFT);
        assertThat(revision.getSupersedesQuote().getId()).isEqualTo(initial.getId());
        assertThat(as(f.customer, () -> quoteService.current(f.order.getId())).id()).isEqualTo(initial.getId());
        ServicePricingCatalog nextCatalog = catalog("REVISION-PUBLISH", "ACTIVE", LocalDateTime.now().minusDays(1), null, "130.00");
        as(f.plumber, () -> quoteService.publish(f.order.getId(), revision.getId(), new QuotePublishRequest(nextCatalog.getId(), 24), "revision-publish"));
        assertThat(quotes.findById(initial.getId()).orElseThrow().getState()).isEqualTo(QuoteState.SUPERSEDED);
        assertThat(countEvent("QUOTE_SUPERSEDED", initial.getId())).isEqualTo(1);
        assertThat(countOutbox("QUOTE_SUPERSEDED", initial.getId())).isEqualTo(1);
        assertThat(countEvent("QUOTE_PUBLISHED", revision.getId())).isEqualTo(1);
        assertThatThrownBy(() -> as(f.customer, () -> quoteService.approve(f.order.getId(), initial.getId(), "old-approve"))).isInstanceOf(RuntimeException.class);
        assertThat(as(f.customer, () -> quoteService.approve(f.order.getId(), revision.getId(), "revision-approve")).state()).isEqualTo(QuoteState.APPROVED.name());
        assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId())).filteredOn(q -> q.getState() == QuoteState.APPROVED).hasSize(1);
        assertThatThrownBy(() -> as(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), new QuoteRevisionRequest("second"), "revision-second"))).isInstanceOf(RuntimeException.class);
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
    }

    @Test
    void revisionFromRejectedInitialSupersedesAndAllowsCustomerApproval() {
        Fixture f = fixture();
        ServiceQuote initial = submittedDraft(f);
        ServicePricingCatalog firstCatalog = catalog("REJECT-REV-INITIAL", "ACTIVE", LocalDateTime.now().minusDays(1), null, "100.00");
        as(f.plumber, () -> quoteService.publish(f.order.getId(), initial.getId(), new QuotePublishRequest(firstCatalog.getId(), 24), "reject-rev-publish-1"));
        as(f.customer, () -> quoteService.reject(f.order.getId(), initial.getId(), new QuoteRejectRequest("Price too high"), "reject-rev-reject-1"));
        assertThat(quotes.findById(initial.getId()).orElseThrow().getState()).isEqualTo(QuoteState.REJECTED);
        assertThat(countEvent("QUOTE_REJECTED", initial.getId())).isEqualTo(1);

        PlumberQuoteResponse revisionResponse = as(f.plumber, () -> quoteService.revise(f.order.getId(), initial.getId(), new QuoteRevisionRequest("Adjusted scope"), "reject-rev-create"));
        ServiceQuote revision = quotes.findById(revisionResponse.id()).orElseThrow();
        assertThat(revision.getQuoteKind()).isEqualTo(QuoteKind.REVISION);
        assertThat(revision.getVersion()).isEqualTo(2);
        assertThat(revision.getState()).isEqualTo(QuoteState.DRAFT);
        assertThat(revision.getSupersedesQuote().getId()).isEqualTo(initial.getId());

        ServicePricingCatalog nextCatalog = catalog("REJECT-REV-NEXT", "ACTIVE", LocalDateTime.now().minusDays(1), null, "80.00");
        as(f.plumber, () -> quoteService.publish(f.order.getId(), revision.getId(), new QuotePublishRequest(nextCatalog.getId(), 24), "reject-rev-publish-2"));

        ServiceQuote supersededInitial = quotes.findById(initial.getId()).orElseThrow();
        assertThat(supersededInitial.getState()).isEqualTo(QuoteState.SUPERSEDED);
        assertThat(countEvent("QUOTE_SUPERSEDED", initial.getId())).isEqualTo(1);
        assertThat(countEvent("QUOTE_PUBLISHED", revision.getId())).isEqualTo(1);

        assertThatThrownBy(() -> as(f.customer, () -> quoteService.approve(f.order.getId(), initial.getId(), "reject-rev-old-approve"))).isInstanceOf(RuntimeException.class);
        CustomerQuoteResponse approvedRevision = as(f.customer, () -> quoteService.approve(f.order.getId(), revision.getId(), "reject-rev-approve"));
        assertThat(approvedRevision.state()).isEqualTo(QuoteState.APPROVED.name());
        assertThat(quotes.findById(revision.getId()).orElseThrow().getState()).isEqualTo(QuoteState.APPROVED);
        assertThat(countEvent("QUOTE_APPROVED", revision.getId())).isEqualTo(1);
    }

    @Test
    void catalogRetirementAfterPublicationDoesNotRewriteSnapshot() {
        Fixture f = fixture();
        ServiceQuote quote = submittedDraft(f);
        ServicePricingCatalog catalog = catalog("SNAPSHOT-CATALOG", "ACTIVE", LocalDateTime.now().minusDays(1), null, "140.00");
        as(f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), new QuotePublishRequest(catalog.getId(), 24), "snapshot-publish"));
        BigDecimal amountBefore = quotes.findById(quote.getId()).orElseThrow().getAmount();
        tx.executeWithoutResult(status -> {
            ServicePricingCatalog row = catalogs.findById(catalog.getId()).orElseThrow();
            row.setStatus("RETIRED");
            catalogMutations.saveAndFlush(row);
        });
        assertThat(quotes.findById(quote.getId()).orElseThrow().getAmount()).isEqualByComparingTo(amountBefore);
        assertThat(quoteLines.findByQuoteIdOrderByIdAsc(quote.getId())).singleElement().satisfies(line -> assertThat(line.getUnitPrice()).isEqualByComparingTo("140.00"));
    }

    private long countEvent(String type, Long quoteId) {
        return quoteEvents.findAll().stream().filter(e -> type.equals(e.getEventType()) && quoteId.equals(e.getQuoteId())).count();
    }
    private long countOutbox(String type, Long quoteId) {
        return outbox.findAll().stream().filter(e -> type.equals(e.getEventType()) && String.valueOf(quoteId).equals(e.getAggregateId())).count();
    }
    private void assertIdemCompleted(User actor, String operation, Long quoteId, String key) {
        assertThat(idem.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actor.getId(), operation, "QUOTE", quoteId, key))
                .get().extracting(Phase2IdempotencyKey::getStatus).isEqualTo(Phase2IdempotencyStatus.COMPLETED);
    }

    private Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer");
        User other = user(Role.CUSTOMER, "other");
        User plumber = user(Role.PLUMBER, "plumber");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber)
                .requestType(RequestType.NEARBY_AUTO).description("quote certification").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        order = orders.saveAndFlush(order);
        return new Fixture(order, plumber, customer, other);
    }
    private ServiceQuote submittedDraft(Fixture fixture) {
        PlumberDiagnosisResponse draft = as(fixture.plumber, () -> diagnosisService.create(fixture.order.getId(), diagnosisRequest(), "draft-" + UUID.randomUUID()));
        as(fixture.plumber, () -> diagnosisService.linkEvidence(fixture.order.getId(), draft.id(), new MockMultipartFile("file", "diag.jpg", "image/jpeg", new byte[]{1, 2, 3}), "evidence-" + UUID.randomUUID()));
        as(fixture.plumber, () -> diagnosisService.submit(fixture.order.getId(), draft.id(), "submit-" + UUID.randomUUID()));
        return quotes.findByServiceOrderIdOrderByVersionAsc(fixture.order.getId()).get(0);
    }
    private ServicePricingCatalog catalog(String key, String state, LocalDateTime from, LocalDateTime to, String laborAmount) {
        ServicePricingCatalog catalog = tx.execute(status -> catalogMutations.saveAndFlush(ServicePricingCatalog.builder()
                .catalogKey(key + "-" + UUID.randomUUID()).currency("INR").version(1).status(state).effectiveFrom(from).effectiveTo(to).build()));
        tx.execute(status -> catalogLineMutations.save(ServicePricingCatalogLine.builder().pricingCatalogId(catalog.getId())
                .lineKey("LABOR").lineType("LABOR").amount(new BigDecimal(laborAmount)).unit("HOUR")
                .minQuantity(new BigDecimal("0.01")).maxQuantity(new BigDecimal("100.00")).build()));
        return catalog;
    }
    private User user(Role role, String prefix) {
        return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x")
                .fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build());
    }
    private DiagnosisDraftRequest diagnosisRequest() {
        return new DiagnosisDraftRequest("pipe", "leaking", "leak observed", "repair joint", new BigDecimal("1.00"), "joint", null, false);
    }
    private <T> T as(User user, Callable<T> action) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))));
        SecurityContextHolder.setContext(context);
        try { return action.call(); }
        catch (Exception e) { if (e.getCause() instanceof RuntimeException r) throw r; throw new RuntimeException(e); }
        finally { SecurityContextHolder.clearContext(); }
    }
    private record Fixture(ServiceOrder order, User plumber, User customer, User otherCustomer) {}
}
