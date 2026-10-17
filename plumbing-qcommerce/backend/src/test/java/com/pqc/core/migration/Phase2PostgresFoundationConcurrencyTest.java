package com.pqc.core.migration;

import com.pqc.core.config.Phase2Properties;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.flywaydb.core.Flyway;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/** Real PostgreSQL races for the Phase 2 foundation claims and locks. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2PostgresFoundationConcurrencyTest {
    private static final String PG_URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String PG_USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PG_PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String TEST_SCHEMA = "phase2_race_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
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
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD));
        admin.execute("CREATE SCHEMA " + TEST_SCHEMA);
        Flyway.configure().dataSource(PG_URL, PG_USER, PG_PASSWORD).schemas(TEST_SCHEMA).defaultSchema(TEST_SCHEMA)
                .locations("classpath:db/migration").load().migrate();
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.flyway.enabled", () -> true);
    }

    @AfterAll
    static void dropSchema() {
        new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD))
                .execute("DROP SCHEMA IF EXISTS " + TEST_SCHEMA + " CASCADE");
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired Phase2EnrollmentRepository enrollments;
    @Autowired Phase2EnrollmentService enrollmentService;
    @Autowired Phase2Properties properties;
    @Autowired Phase2IdempotencyService idempotencyService;
    @Autowired Phase2IdempotencyKeyRepository idempotency;
    @Autowired ServicePricingCatalogService catalogService;
    @Autowired ServicePricingCatalogLineService catalogLineService;
    @Autowired ServicePricingCatalogRepository catalogs;
    @Autowired ServiceQuoteEventService eventService;
    @Autowired ServiceQuoteEventRepository events;
    @Autowired OutboxEventRepository outbox;
    @Autowired TransactionTemplate transactionTemplate;

    @BeforeEach
    void enablePhase2() {
        properties.setEnabled(true);
    }

    @Test
    void concurrentEnrollmentHasOneImmutableWinnerAndHealthyLoser() throws Exception {
        User customer = user("enroll-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).status(OrderStatus.ACCEPTED)
                .requestType(RequestType.NEARBY_AUTO).description("concurrent enrollment").arrivedAt(LocalDateTime.now()).build());
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Phase2Enrollment>> futures = List.of(
                pool.submit(() -> { start.await(); return enrollmentService.enrollIfEnabledAfterArrival(order.getId()); }),
                pool.submit(() -> { start.await(); return enrollmentService.enrollIfEnabledAfterArrival(order.getId()); }));
        start.countDown();
        Phase2Enrollment first = futures.get(0).get(20, TimeUnit.SECONDS);
        Phase2Enrollment second = futures.get(1).get(20, TimeUnit.SECONDS);
        pool.shutdownNow();
        assertThat(first.getId()).isEqualTo(second.getId());
        assertThat(enrollments.findByServiceOrderId(order.getId()).orElseThrow().getId()).isEqualTo(first.getId());
        assertThat(jdbc.queryForObject("select count(*) from phase2_enrollments where service_order_id = ?", Integer.class, order.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("select enabled_snapshot from phase2_enrollments where service_order_id = ?", Boolean.class, order.getId())).isTrue();
        assertThat(orders.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void concurrentCatalogActivationAllowsOneOverlappingActiveVersion() throws Exception {
        String key = "family-" + UUID.randomUUID();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Object> activate = () -> { start.await(); try { return catalogService.activate(key, " inr ", (int) (System.nanoTime() & Integer.MAX_VALUE), LocalDateTime.now(), null); } catch (Exception e) { return e; } };
        List<Future<Object>> futures = List.of(pool.submit(activate), pool.submit(activate));
        start.countDown();
        Object a = futures.get(0).get(20, TimeUnit.SECONDS);
        Object b = futures.get(1).get(20, TimeUnit.SECONDS);
        pool.shutdownNow();
        assertThat(List.of(a, b).stream().filter(ServicePricingCatalog.class::isInstance).count()).isEqualTo(1);
        assertThat(List.of(a, b).stream().filter(Throwable.class::isInstance).count()).isEqualTo(1);
        assertThat(catalogs.findByCatalogKeyAndCurrencyOrderByVersionDesc(key.toUpperCase(), "INR")).hasSize(1);
        assertThat(catalogs.findByCatalogKeyAndCurrencyOrderByVersionDesc(key.toUpperCase(), "INR").get(0).getStatus()).isEqualTo("ACTIVE");
        String other = key + "-other";
        assertThat(catalogService.normalizeKey(other)).isEqualTo(other.toUpperCase());
        assertThat(catalogService.normalizeKey(" " + key + " ")).isEqualTo(catalogService.normalizeKey(key));
    }

    @Test
    void concurrentIdempotencyClaimsReplayOneHealthyOperation() throws Exception {
        User actor = user("idem-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        Long resource = 700000L + (System.nanoTime() & 100000L);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Phase2IdempotencyKey> claim = () -> { start.await(); return idempotencyService.begin(actor.getId(), "DIAGNOSIS_CREATE", "SERVICE_ORDER", resource, "key-" + resource, "same-fingerprint"); };
        List<Future<Phase2IdempotencyKey>> futures = List.of(pool.submit(claim), pool.submit(claim));
        start.countDown();
        Object a = get(futures.get(0));
        Object b = get(futures.get(1));
        pool.shutdownNow();
        assertThat(List.of(a, b).stream().filter(Phase2IdempotencyKey.class::isInstance).count()).isEqualTo(1);
        assertThat(List.of(a, b).stream().filter(t -> t instanceof org.springframework.web.server.ResponseStatusException e && e.getReason().equals("OPERATION_IN_PROGRESS")).count()).isEqualTo(1);
        Long claimId = List.of(a, b).stream().filter(Phase2IdempotencyKey.class::isInstance).map(Phase2IdempotencyKey.class::cast).findFirst().orElseThrow().getId();
        idempotencyService.complete(claimId, "{\"ok\":true}");
        assertThat(idempotencyService.begin(actor.getId(), "DIAGNOSIS_CREATE", "SERVICE_ORDER", resource, "key-" + resource, "same-fingerprint").getResponsePayload()).isEqualTo("{\"ok\":true}");
        assertThat(idempotency.count()).isEqualTo(1);
    }

    private Object get(Future<Phase2IdempotencyKey> future) throws Exception {
        try { return future.get(20, TimeUnit.SECONDS); }
        catch (ExecutionException e) { return e.getCause(); }
    }

    @Test
    void idempotencyRejectsFingerprintConflictAndFailedKeysNeedNewKey() {
        User actor = user("idem-matrix-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        Long resource = 710000L + (System.nanoTime() & 100000L);
        String key = "matrix-" + resource;
        Phase2IdempotencyKey claim = idempotencyService.begin(actor.getId(), "QUOTE_CREATE", "SERVICE_ORDER", resource, key, "a");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> idempotencyService.begin(actor.getId(), "QUOTE_CREATE", "SERVICE_ORDER", resource, key, "b"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class).hasMessageContaining("payload conflict");
        idempotencyService.fail(claim.getId(), "failed-body");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> idempotencyService.begin(actor.getId(), "QUOTE_CREATE", "SERVICE_ORDER", resource, key, "a"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class).hasMessageContaining("terminal");
        Phase2IdempotencyKey retry = idempotencyService.begin(actor.getId(), "QUOTE_CREATE", "SERVICE_ORDER", resource, key + "-retry", "a");
        assertThat(retry.getId()).isNotEqualTo(claim.getId());
        Phase2IdempotencyKey otherResource = idempotencyService.begin(actor.getId(), "QUOTE_CREATE", "SERVICE_ORDER", resource + 1, key, "a");
        assertThat(otherResource.getId()).isNotEqualTo(claim.getId());
        User otherActor = user("idem-other-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        Phase2IdempotencyKey otherActorClaim = idempotencyService.begin(otherActor.getId(), "QUOTE_CREATE", "SERVICE_ORDER", resource, key, "a");
        assertThat(otherActorClaim.getId()).isNotEqualTo(claim.getId());
    }

    @Test
    void eventClaimEnqueuesOneOutboxRowAndDuplicateDoesNotEnqueue() throws Exception {
        User customer = user("event-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).status(OrderStatus.ACCEPTED)
                .requestType(RequestType.NEARBY_AUTO).description("event race").build());
        ServiceQuoteEvent template = ServiceQuoteEvent.builder().serviceOrderId(order.getId()).aggregateType("QUOTE").aggregateId(order.getId())
                .transitionKey("expire-1").eventType("QUOTE_EXPIRED").toState("EXPIRED").build();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<ServiceQuoteEvent> record = () -> { start.await(); return eventService.record(template, "quote-events", "QUOTE_EXPIRED:" + order.getId()); };
        List<Future<ServiceQuoteEvent>> futures = List.of(pool.submit(record), pool.submit(record));
        start.countDown();
        assertThat(futures.get(0).get(20, TimeUnit.SECONDS).getId()).isEqualTo(futures.get(1).get(20, TimeUnit.SECONDS).getId());
        pool.shutdownNow();
        assertThat(events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType("QUOTE", order.getId(), "expire-1", "QUOTE_EXPIRED")).isPresent();
        assertThat(outbox.findAll().stream().filter(e -> "QUOTE_EXPIRED".equals(e.getEventType())).count()).isEqualTo(1);
    }

    @Test
    void transitionEventTypesEachHaveOneAuditAndOutboxRow() {
        User customer = user("event-types-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).status(OrderStatus.PENDING)
                .requestType(RequestType.NEARBY_AUTO).description("event types").build());
        for (String type : List.of("ADDENDUM_SUPERSEDED", "PHASE2_CANCELLED")) {
            ServiceQuoteEvent event = ServiceQuoteEvent.builder().serviceOrderId(order.getId()).aggregateType("QUOTE").aggregateId(order.getId())
                    .transitionKey(type + "-1").eventType(type).toState("CANCELLED").build();
            eventService.record(event, "quote-events", type + ":" + order.getId());
            eventService.record(event, "quote-events", type + ":" + order.getId());
        }
        assertThat(events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType("QUOTE", order.getId(), "ADDENDUM_SUPERSEDED-1", "ADDENDUM_SUPERSEDED")).isPresent();
        assertThat(events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType("QUOTE", order.getId(), "PHASE2_CANCELLED-1", "PHASE2_CANCELLED")).isPresent();
        assertThat(outbox.findAll().stream().filter(e -> List.of("ADDENDUM_SUPERSEDED", "PHASE2_CANCELLED").contains(e.getEventType())).count()).isEqualTo(2);
    }

    @Test
    void eventAndOutboxBothRollbackTogether() {
        User customer = user("event-rollback-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).status(OrderStatus.PENDING)
                .requestType(RequestType.NEARBY_AUTO).description("rollback").build());
        transactionTemplate.execute(status -> {
            eventService.record(ServiceQuoteEvent.builder().serviceOrderId(order.getId()).aggregateType("QUOTE").aggregateId(order.getId())
                    .transitionKey("rollback-1").eventType("PHASE2_CANCELLED").build(), "quote-events", "rollback");
            status.setRollbackOnly();
            return null;
        });
        assertThat(events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType("QUOTE", order.getId(), "rollback-1", "PHASE2_CANCELLED")).isEmpty();
        assertThat(outbox.findAll().stream().filter(e -> "rollback".equals(e.getPayload())).count()).isZero();
    }

    @Test
    void referencedCatalogAndLineAreImmutableButRetirementRemainsAllowed() {
        String key = "immutable-" + UUID.randomUUID();
        ServicePricingCatalog catalog = catalogService.activate(key, "INR", 1, LocalDateTime.now(), null);
        Long lineId = jdbc.queryForObject("insert into service_pricing_catalog_lines (pricing_catalog_id, line_key, line_type, amount, unit, min_quantity, max_quantity, created_at) values (?, 'LABOR', 'LABOR', 300.00, 'HOUR', 1.00, 100.00, current_timestamp) returning id", Long.class, catalog.getId());
        User customer = user("catalog-ref-" + UUID.randomUUID() + "@test", Role.CUSTOMER);
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).status(OrderStatus.PENDING)
                .requestType(RequestType.NEARBY_AUTO).description("catalog ref").build());
        jdbc.update("insert into service_diagnoses (service_order_id, version, state, summary, created_at) values (?, 1, 'SUBMITTED', 'summary', current_timestamp)", order.getId());
        jdbc.update("insert into service_quotes (service_order_id, quote_kind, version, state, pricing_catalog_id, amount, created_at) values (?, 'INITIAL', 1, 'PUBLISHED', ?, 300.00, current_timestamp)", order.getId(), catalog.getId());
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> catalogService.updateCurrency(catalog.getId(), "USD"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> catalogService.updateEffectivePeriod(catalog.getId(), LocalDateTime.now(), null))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> catalogLineService.updateAmount(lineId, new BigDecimal("999.00")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> catalogLineService.delete(lineId))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> catalogService.delete(catalog.getId()))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(catalogService.retire(catalog.getId()).getStatus()).isEqualTo("RETIRED");
        assertThat(jdbc.queryForObject("select amount from service_pricing_catalog_lines where id = ?", BigDecimal.class, lineId)).isEqualByComparingTo("300.00");
        assertThat(jdbc.queryForObject("select amount from service_quotes where pricing_catalog_id = ?", BigDecimal.class, catalog.getId())).isEqualByComparingTo("300.00");
    }

    private User user(String email, Role role) {
        return users.saveAndFlush(User.builder().email(email).password("test").fullName(role.name()).phone("9000000000").role(role).build());
    }
}
