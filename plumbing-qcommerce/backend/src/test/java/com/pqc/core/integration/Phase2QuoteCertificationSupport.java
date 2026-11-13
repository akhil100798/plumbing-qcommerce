package com.pqc.core.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.controller.AdminQuoteController;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;

/** Shared real-PostgreSQL fixtures and assertions for the final quote certification suites. */
@SpringBootTest
@ActiveProfiles("test")
abstract class Phase2QuoteCertificationSupport {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_quote_cert_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(URL, USER, PASSWORD));
        // A cached Spring context may be evicted and rebuilt in the same JVM.
        // The support schema name is stable for sibling certification classes,
        // so clear any prior instance before replaying its migrations.
        admin.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
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
        registry.add("app.photos.storage-dir", () -> "target/phase2-quote-certification-photos");
    }

    @Autowired Phase2QuoteService quoteService;
    @Autowired ServiceDiagnosisService diagnosisService;
    @Autowired ServiceOrderService orderService;
    @Autowired ServiceOrderRepository orders;
    @Autowired UserRepository users;
    @Autowired ServiceQuoteRepository quotes;
    @Autowired ServiceQuoteLineRepository quoteLines;
    @Autowired ProductOrderRepository productOrders;
    @Autowired ProductOrderItemRepository productOrderItems;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired StoreRepository stores;
    @Autowired ServiceQuoteEventRepository quoteEvents;
    @Autowired ServicePricingCatalogMutationRepository catalogMutations;
    @Autowired ServicePricingCatalogLineMutationRepository catalogLineMutations;
    @Autowired PaymentOperationRepository paymentOperations;
    @Autowired OutboxEventRepository outbox;
    @Autowired Phase2IdempotencyKeyRepository idempotency;
    @Autowired Phase2EnrollmentRepository enrollments;
    @Autowired Phase2ReconciliationRepository reconciliations;
    @Autowired Phase2AuthorizationService phase2Authorization;
    @Autowired PlumberMaterialService plumberMaterialService;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate jdbc;
    @Autowired AdminQuoteController adminQuoteController;

    @AfterEach void clearCertificationAuthentication() { SecurityContextHolder.clearContext(); }

    protected Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer");
        User otherCustomer = user(Role.CUSTOMER, "other-customer");
        User plumber = user(Role.PLUMBER, "plumber");
        User otherPlumber = user(Role.PLUMBER, "other-plumber");
        User operator = user(Role.OPERATIONS_ADMIN, "operator");
        User admin = user(Role.ADMIN, "admin");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber)
                .requestType(RequestType.NEARBY_AUTO).description("quote certification").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        ServiceOrder persistedOrder = orders.saveAndFlush(order);
        PlumberDiagnosisResponse diagnosis = as(plumber, () -> diagnosisService.create(persistedOrder.getId(), diagnosisRequest(), key("diagnosis")));
        as(plumber, () -> diagnosisService.linkEvidence(persistedOrder.getId(), diagnosis.id(),
                new MockMultipartFile("file", "diagnosis.jpg", "image/jpeg", new byte[]{1, 2, 3}), key("evidence")));
        as(plumber, () -> diagnosisService.submit(persistedOrder.getId(), diagnosis.id(), key("submit")));
        ServiceQuote quote = quotes.findByServiceOrderIdOrderByVersionAsc(persistedOrder.getId()).get(0);
        Catalog catalog = catalog("quote-cert");
        as(plumber, () -> quoteService.updateDraft(persistedOrder.getId(), quote.getId(),
                new QuoteDraftUpdateRequest(catalog.lineId(), new BigDecimal("1.00")), key("draft-edit")));
        return new Fixture(persistedOrder, customer, otherCustomer, plumber, otherPlumber, operator, admin, quote, catalog);
    }

    protected void enroll(Fixture f) {
        enrollments.findByServiceOrderId(f.order().getId()).orElseGet(() -> enrollments.saveAndFlush(Phase2Enrollment.builder().serviceOrderId(f.order().getId())
                .enabledSnapshot(true).policySnapshot("certification").build()));
    }

    protected ServiceQuote published(Fixture f) {
        as(f.plumber(), () -> quoteService.publish(f.order().getId(), f.quote().getId(),
                new QuotePublishRequest(f.catalog().catalogId(), 24), key("publish")));
        return quotes.findById(f.quote().getId()).orElseThrow();
    }

    protected ServiceQuote prepare(Fixture f, QuoteState target) {
        if (target == QuoteState.DRAFT) return f.quote();
        ServiceQuote quote = published(f);
        switch (target) {
            case PUBLISHED -> { }
            case APPROVED -> as(f.customer(), () -> quoteService.approve(f.order().getId(), quote.getId(), key("approve")));
            case REJECTED -> as(f.customer(), () -> quoteService.reject(f.order().getId(), quote.getId(), new QuoteRejectRequest("declined"), key("reject")));
            case EXPIRED -> {
                LocalDateTime publishedAt = LocalDateTime.now().minusHours(2);
                jdbc.update("UPDATE service_quotes SET published_at=?, expires_at=? WHERE id=?",
                        publishedAt, publishedAt.plusHours(1), quote.getId());
                as(f.customer(), () -> quoteService.current(f.order().getId()));
            }
            case SUPERSEDED -> {
                PlumberQuoteResponse revision = as(f.plumber(), () -> quoteService.revise(f.order().getId(), quote.getId(),
                        new QuoteRevisionRequest("bounded correction"), key("revision-create")));
                as(f.plumber(), () -> quoteService.updateDraft(f.order().getId(), revision.id(),
                        new QuoteDraftUpdateRequest(f.catalog().lineId(), new BigDecimal("1.00")), key("revision-edit")));
                as(f.plumber(), () -> quoteService.publish(f.order().getId(), revision.id(),
                        new QuotePublishRequest(f.catalog().catalogId(), 24), key("revision-publish")));
            }
            case CANCELLED -> as(f.admin(), () -> orderService.cancelOrder(f.order().getId(), "certification cancellation"));
            default -> throw new IllegalArgumentException("Unsupported quote state " + target);
        }
        return quotes.findById(quote.getId()).orElseThrow();
    }

    protected Catalog catalog(String prefix) {
        return catalog(prefix, new BigDecimal("125.50"));
    }

    protected Catalog catalog(String prefix, BigDecimal laborAmount) {
        ServicePricingCatalog catalog = tx.execute(status -> catalogMutations.saveAndFlush(ServicePricingCatalog.builder()
                .catalogKey(prefix + "-" + UUID.randomUUID()).currency("INR").version(1).status("ACTIVE")
                .effectiveFrom(LocalDateTime.now().minusDays(1)).build()));
        ServicePricingCatalogLine line = tx.execute(status -> catalogLineMutations.save(ServicePricingCatalogLine.builder()
                .pricingCatalogId(catalog.getId()).lineKey("LABOR-" + prefix).lineType("LABOR")
                .amount(laborAmount).unit("HOUR").minQuantity(new BigDecimal("0.01"))
                .maxQuantity(new BigDecimal("100.00")).build()));
        return new Catalog(catalog.getId(), line.getId());
    }

    protected Snapshot snapshot(Long quoteId) {
        Map<String, Object> quote = jdbc.queryForMap("SELECT state,amount,labor_subtotal,known_material_subtotal,currency,pricing_catalog_id,pricing_catalog_version,published_at,expires_at,approved_at,rejected_at,immutable_snapshot_at,optimistic_version FROM service_quotes WHERE id=?", quoteId);
        List<Map<String, Object>> lines = jdbc.queryForList("SELECT line_type,description,amount,pricing_source,pricing_catalog_line_id,quantity,unit,unit_price,line_total,pricing_source_version FROM service_quote_lines WHERE quote_id=? ORDER BY id", quoteId);
        return new Snapshot(quote, lines);
    }

    protected long eventCount(Long quoteId) { return quoteEvents.findAll().stream().filter(e -> quoteId.equals(e.getQuoteId())).count(); }
    protected long eventCount(Long quoteId, String eventType) { return quoteEvents.findAll().stream().filter(e -> quoteId.equals(e.getQuoteId()) && eventType.equals(e.getEventType())).count(); }
    protected long outboxCount(Long quoteId) { return outbox.findAll().stream().filter(e -> String.valueOf(quoteId).equals(e.getAggregateId()) && "QUOTE".equals(e.getAggregateType())).count(); }
    protected long paymentCount(Long orderId) { return paymentOperations.findByServiceOrderIdAndPurpose(orderId, PaymentOperationService.PURPOSE).isPresent() ? 1 : 0; }

    protected <T> T as(User user, Callable<T> action) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))));
        SecurityContextHolder.setContext(context);
        try { return action.call(); }
        catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException(e); }
        finally { SecurityContextHolder.clearContext(); }
    }

    protected String key(String prefix) { return prefix + "-" + UUID.randomUUID(); }
    protected DiagnosisDraftRequest diagnosisRequest() { return new DiagnosisDraftRequest("pipe", "leaking", "leak observed", "repair joint", new BigDecimal("1.00"), "joint", null, false); }
    protected User user(Role role, String prefix) {
        return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@cert.test").password("not-a-secret")
                .fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build());
    }

    protected record Fixture(ServiceOrder order, User customer, User otherCustomer, User plumber, User otherPlumber,
                             User operator, User admin, ServiceQuote quote, Catalog catalog) {}
    protected record Catalog(Long catalogId, Long lineId) {}
    protected record Snapshot(Map<String, Object> quote, List<Map<String, Object>> lines) {}
}
