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
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class Phase2QuotePricingIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_quote_pricing_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource static void postgres(DynamicPropertyRegistry registry) {
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
        registry.add("app.photos.storage-dir", () -> "target/phase2-quote-pricing-photos");
    }

    @Autowired Phase2QuoteService quoteService;
    @Autowired ServiceDiagnosisService diagnosisService;
    @Autowired ServicePricingCatalogService catalogService;
    @Autowired ServicePricingCatalogLineService catalogLineService;
    @Autowired ServicePricingCatalogRepository catalogs;
    @Autowired ServicePricingCatalogLineRepository catalogLines;
    @Autowired ServiceOrderRepository orders;
    @Autowired UserRepository users;
    @Autowired ServiceQuoteRepository quotes;
    @Autowired ServiceQuoteLineRepository lines;
    @Autowired PaymentOperationRepository paymentOperations;
    @Autowired JdbcTemplate jdbc;

    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test void configuredBoundsAreInclusiveAndRejectOutsideZeroNegativeAndExcessScale() {
        Fixture f = fixture();
        ServiceQuote quote = draft(f);
        Catalog c = catalog("BOUNDARY", LocalDateTime.now().minusDays(1), null, "100.00", "HOUR", "0.50", "3.00");

        assertQuantityFailure(f, quote, c.lineId, new BigDecimal("0.49"), "below-min", 400);
        assertQuantitySuccess(f, quote, c.lineId, new BigDecimal("0.50"), "at-min");
        assertQuantitySuccess(f, quote, c.lineId, new BigDecimal("1.25"), "middle");
        assertQuantitySuccess(f, quote, c.lineId, new BigDecimal("3.00"), "at-max");
        assertQuantityFailure(f, quote, c.lineId, new BigDecimal("3.01"), "above-max", 400);
        assertQuantityFailure(f, quote, c.lineId, BigDecimal.ZERO, "zero", 400);
        assertQuantityFailure(f, quote, c.lineId, new BigDecimal("-0.50"), "negative", 400);
        assertQuantityFailure(f, quote, c.lineId, new BigDecimal("0.501"), "excess-scale", 400);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_lines WHERE quote_id=?", Long.class, quote.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT unit FROM service_quote_lines WHERE quote_id=?", String.class, quote.getId())).isEqualTo("HOUR");
        assertThat(jdbc.queryForObject("SELECT quantity FROM service_quote_lines WHERE quote_id=?", BigDecimal.class, quote.getId())).isEqualByComparingTo("3.00");
        assertThat(jdbc.queryForObject("SELECT unit_price FROM service_quote_lines WHERE quote_id=?", BigDecimal.class, quote.getId())).isEqualByComparingTo("100.00");
        assertThat(jdbc.queryForObject("SELECT line_total FROM service_quote_lines WHERE quote_id=?", BigDecimal.class, quote.getId())).isEqualByComparingTo("300.00");
        assertThat(quotes.findById(quote.getId()).orElseThrow().getAmount()).isEqualByComparingTo("300.00");
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
    }

    @Test void activeInrCatalogIsSelectedAndServerOwnsUnitPriceLineTotalAndSubtotal() {
        Fixture f = fixture();
        ServiceQuote quote = draft(f);
        Catalog c = catalog("ACTIVE-INR", LocalDateTime.now().minusDays(1), null, "125.50", "HOUR", "1.00", "10.00");

        PlumberQuoteResponse updated = as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), quote.getId(), new QuoteDraftUpdateRequest(c.lineId, new BigDecimal("2.00")), "active-inr-update"));
        assertThat(updated.total()).isEqualByComparingTo("251.00");
        Map<String, Object> row = jdbc.queryForMap("SELECT l.unit,l.quantity,l.unit_price,l.line_total,l.pricing_source_version,q.labor_subtotal,q.known_material_subtotal,q.amount,q.pricing_catalog_id,q.pricing_catalog_version FROM service_quote_lines l JOIN service_quotes q ON q.id=l.quote_id WHERE q.id=?", quote.getId());
        assertThat(row.get("unit")).isEqualTo("HOUR");
        assertThat((BigDecimal) row.get("quantity")).isEqualByComparingTo("2.00");
        assertThat((BigDecimal) row.get("unit_price")).isEqualByComparingTo("125.50");
        assertThat((BigDecimal) row.get("line_total")).isEqualByComparingTo("251.00");
        assertThat(((Number) row.get("pricing_source_version")).intValue()).isEqualTo(4);
        assertThat((BigDecimal) row.get("labor_subtotal")).isEqualByComparingTo("251.00");
        assertThat((BigDecimal) row.get("known_material_subtotal")).isEqualByComparingTo("0.00");
        assertThat((BigDecimal) row.get("amount")).isEqualByComparingTo("251.00");
        assertThat(((Number) row.get("pricing_catalog_id")).longValue()).isEqualTo(c.catalogId);
        assertThat(((Number) row.get("pricing_catalog_version")).intValue()).isEqualTo(4);
        assertThat(QuoteDraftUpdateRequest.class.getRecordComponents()).extracting("name").containsExactly("pricingCatalogLineId", "quantity");
    }

    @Test void catalogSelectionEnforcesCurrencyRetirementFutureAndEndTime() {
        Fixture wrongCurrencyFixture = fixture();
        ServiceQuote wrongCurrencyQuote = draft(wrongCurrencyFixture);
        assertThatThrownBy(() -> catalogService.activate("USD-" + UUID.randomUUID(), "USD", 1, LocalDateTime.now().minusDays(1), null))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(400));
        assertThatThrownBy(() -> as(wrongCurrencyFixture.plumber, () -> quoteService.publish(wrongCurrencyFixture.order.getId(), wrongCurrencyQuote.getId(), new QuotePublishRequest(null, 24), "wrong-currency")))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(409));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_pricing_catalog WHERE currency <> 'INR'", Long.class)).isZero();

        Fixture retiredFixture = fixture();
        ServiceQuote retiredQuote = draft(retiredFixture);
        Catalog retired = catalog("RETIRED", LocalDateTime.now().minusDays(1), null, "90.00", "HOUR", "1.00", "10.00");
        catalogService.retire(retired.catalogId);
        assertPublishRejected(retiredFixture, retiredQuote, retired.catalogId, "retired", 409);

        Fixture futureFixture = fixture();
        ServiceQuote futureQuote = draft(futureFixture);
        Catalog future = catalog("FUTURE", LocalDateTime.now().plusDays(1), null, "90.00", "HOUR", "1.00", "10.00");
        assertPublishRejected(futureFixture, futureQuote, future.catalogId, "future", 409);

        Fixture endedFixture = fixture();
        ServiceQuote endedQuote = draft(endedFixture);
        LocalDateTime start = LocalDateTime.now().minusDays(3);
        Catalog ended = catalog("ENDED", start, start.plusDays(1), "90.00", "HOUR", "1.00", "10.00");
        assertPublishRejected(endedFixture, endedQuote, ended.catalogId, "ended", 409);

        Fixture activeFixture = fixture();
        ServiceQuote activeQuote = draft(activeFixture);
        Catalog active = catalog("ACTIVE-SELECTION", LocalDateTime.now().minusDays(1), null, "90.00", "HOUR", "1.00", "10.00");
        assertThat(as(activeFixture.plumber, () -> quoteService.publish(activeFixture.order.getId(), activeQuote.getId(), new QuotePublishRequest(active.catalogId, 24), "active-selection")).state()).isEqualTo("PUBLISHED");
    }

    @Test void catalogActivationStillRejectsOverlappingActiveRangesUnderAdvisoryLock() {
        String key = "OVERLAP-" + UUID.randomUUID();
        catalogService.activate(key, "INR", 1, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(2));
        assertThatThrownBy(() -> catalogService.activate(key, "inr", 2, LocalDateTime.now(), LocalDateTime.now().plusDays(1)))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(409));
        assertThat(catalogs.findByCatalogKeyAndCurrencyOrderByVersionDesc(key.trim().replaceAll("\\s+", " ").toUpperCase(java.util.Locale.ROOT), "INR")).hasSize(1);
    }

    @Test void publishSnapshotsAuthoritativeUnitQuantityPriceAndCatalogVersionAfterRetirementAndNewVersion() {
        Fixture f = fixture();
        ServiceQuote quote = draft(f);
        Catalog original = catalog("SNAPSHOT", LocalDateTime.now().minusDays(1), null, "175.25", "HOUR", "1.00", "10.00");
        as(f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), new QuotePublishRequest(original.catalogId, 24), "snapshot-publish"));
        Map<String, Object> before = jdbc.queryForMap("SELECT l.unit,l.quantity,l.unit_price,l.line_total,l.pricing_source_version,q.labor_subtotal,q.known_material_subtotal,q.amount,q.pricing_catalog_id,q.pricing_catalog_version FROM service_quote_lines l JOIN service_quotes q ON q.id=l.quote_id WHERE q.id=?", quote.getId());
        assertThat(before.get("unit")).isEqualTo("HOUR");
        assertThat((BigDecimal) before.get("quantity")).isEqualByComparingTo("1.00");
        assertThat((BigDecimal) before.get("unit_price")).isEqualByComparingTo("175.25");
        assertThat((BigDecimal) before.get("line_total")).isEqualByComparingTo("175.25");
        assertThat((BigDecimal) before.get("labor_subtotal")).isEqualByComparingTo("175.25");
        assertThat((BigDecimal) before.get("known_material_subtotal")).isEqualByComparingTo("0.00");
        assertThat((BigDecimal) before.get("amount")).isEqualByComparingTo("175.25");
        catalogService.retire(original.catalogId);
        assertThatThrownBy(() -> catalogLineService.updateAmount(original.lineId, new BigDecimal("999.00"))).isInstanceOf(ResponseStatusException.class);
        Catalog next = catalog("SNAPSHOT", LocalDateTime.now(), null, "999.00", "MINUTE", "1.00", "50.00", 5);
        Map<String, Object> after = jdbc.queryForMap("SELECT l.unit,l.quantity,l.unit_price,l.line_total,l.pricing_source_version,q.labor_subtotal,q.known_material_subtotal,q.amount,q.pricing_catalog_id,q.pricing_catalog_version FROM service_quote_lines l JOIN service_quotes q ON q.id=l.quote_id WHERE q.id=?", quote.getId());
        assertThat(after).isEqualTo(before);
        assertThat(((Number) after.get("pricing_catalog_id")).longValue()).isEqualTo(original.catalogId);
        assertThat(((Number) after.get("pricing_catalog_version")).intValue()).isEqualTo(4);
        assertThat(((Number) after.get("pricing_source_version")).intValue()).isEqualTo(4);
        assertThat(catalogs.findById(next.catalogId)).isPresent();
        assertThat(paymentOperations.findByServiceOrderIdAndPurpose(f.order.getId(), PaymentOperationService.PURPOSE)).isEmpty();
    }

    @Test void newCatalogLineAdministrationRequiresExplicitUnitAndValidBounds() {
        ServicePricingCatalog catalog = catalogService.activate("ADMIN-" + UUID.randomUUID(), "INR", 1, LocalDateTime.now().minusDays(1), null);
        assertThatThrownBy(() -> catalogLineService.create(catalog.getId(), "INVALID", "LABOR", BigDecimal.TEN, " ", BigDecimal.ONE, BigDecimal.TEN)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> catalogLineService.create(catalog.getId(), "INVALID", "LABOR", BigDecimal.TEN, "HOUR", BigDecimal.ZERO, BigDecimal.TEN)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> catalogLineService.create(catalog.getId(), "INVALID", "LABOR", BigDecimal.TEN, "HOUR", BigDecimal.ONE, new BigDecimal("0.50"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> catalogLineService.create(catalog.getId(), "INVALID", "LABOR", BigDecimal.TEN, "HOUR", new BigDecimal("0.001"), BigDecimal.TEN)).isInstanceOf(IllegalArgumentException.class);
    }

    private void assertQuantitySuccess(Fixture f, ServiceQuote quote, Long lineId, BigDecimal quantity, String suffix) {
        var result = as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), quote.getId(), new QuoteDraftUpdateRequest(lineId, quantity), "quantity-" + suffix));
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("100.00").multiply(quantity).setScale(2));
        assertThat(jdbc.queryForObject("SELECT status FROM phase2_idempotency_keys WHERE idempotency_key=? AND operation='UPDATE_QUOTE'", String.class, "quantity-" + suffix)).isEqualTo("COMPLETED");
    }

    private void assertQuantityFailure(Fixture f, ServiceQuote quote, Long lineId, BigDecimal quantity, String suffix, int status) {
        assertThatThrownBy(() -> as(f.plumber, () -> quoteService.updateDraft(f.order.getId(), quote.getId(), new QuoteDraftUpdateRequest(lineId, quantity), "quantity-" + suffix)))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(status));
        assertThat(jdbc.queryForObject("SELECT status FROM phase2_idempotency_keys WHERE idempotency_key=? AND operation='UPDATE_QUOTE'", String.class, "quantity-" + suffix)).isEqualTo("FAILED");
    }

    private void assertPublishRejected(Fixture f, ServiceQuote quote, Long catalogId, String key, int status) {
        assertThatThrownBy(() -> as(f.plumber, () -> quoteService.publish(f.order.getId(), quote.getId(), new QuotePublishRequest(catalogId, 24), "catalog-" + key)))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(status));
        assertThat(quotes.findById(quote.getId()).orElseThrow().getState()).isEqualTo(QuoteState.DRAFT);
        assertThat(jdbc.queryForObject("SELECT status FROM phase2_idempotency_keys WHERE idempotency_key=? AND operation='PUBLISH_QUOTE'", String.class, "catalog-" + key)).isEqualTo("FAILED");
    }

    private Fixture fixture() {
        User customer = user(Role.CUSTOMER, "customer");
        User plumber = user(Role.PLUMBER, "plumber");
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber)
                .requestType(RequestType.NEARBY_AUTO).description("quote pricing bounds").build());
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setArrivedAt(LocalDateTime.now());
        order = orders.saveAndFlush(order);
        return new Fixture(order, plumber, customer);
    }

    private ServiceQuote draft(Fixture f) {
        PlumberDiagnosisResponse diagnosis = as(f.plumber, () -> diagnosisService.create(f.order.getId(), diagnosisRequest(), "pricing-diagnosis-" + UUID.randomUUID()));
        as(f.plumber, () -> diagnosisService.linkEvidence(f.order.getId(), diagnosis.id(), new MockMultipartFile("file", "diagnosis.jpg", "image/jpeg", new byte[]{1, 2, 3}), "pricing-evidence-" + UUID.randomUUID()));
        as(f.plumber, () -> diagnosisService.submit(f.order.getId(), diagnosis.id(), "pricing-submit-" + UUID.randomUUID()));
        return quotes.findByServiceOrderIdOrderByVersionAsc(f.order.getId()).stream().filter(q -> q.getQuoteKind() == QuoteKind.INITIAL).findFirst().orElseThrow();
    }

    private Catalog catalog(String prefix, LocalDateTime from, LocalDateTime to, String price, String unit, String min, String max) {
        return catalog(prefix, from, to, price, unit, min, max, 4);
    }
    private Catalog catalog(String prefix, LocalDateTime from, LocalDateTime to, String price, String unit, String min, String max, int version) {
        ServicePricingCatalog catalog = catalogService.activate(prefix + "-" + UUID.randomUUID(), "INR", version, from, to);
        ServicePricingCatalogLine line = catalogLineService.create(catalog.getId(), "LABOR", "LABOR", new BigDecimal(price), unit, new BigDecimal(min), new BigDecimal(max));
        return new Catalog(catalog.getId(), line.getId());
    }

    private User user(Role role, String prefix) {
        return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x").fullName(prefix)
                .phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build());
    }
    private DiagnosisDraftRequest diagnosisRequest() {
        return new DiagnosisDraftRequest("pipe", "leaking", "leak observed", "repair joint", new BigDecimal("1.00"), "joint", null, false);
    }
    private <T> T as(User actor, Callable<T> action) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(actor.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + actor.getRole().name()))));
        SecurityContextHolder.setContext(context);
        try { return action.call(); }
        catch (Exception e) { if (e instanceof RuntimeException runtime) throw runtime; throw new RuntimeException(e); }
        finally { SecurityContextHolder.clearContext(); }
    }
    private record Fixture(ServiceOrder order, User plumber, User customer) {}
    private record Catalog(Long catalogId, Long lineId) {}
}
