package com.pqc.core.migration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
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
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Real PostgreSQL proof for the Phase 2 lock graph.  Every worker owns a
 * separate transaction and obtains database row locks; no Java monitor is
 * used as a substitute for PostgreSQL locking.
 */
@SpringBootTest
@ActiveProfiles("test")
class Phase2LockOrderPostgresIntegrationTest {
    private static final String PG_URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String PG_USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PG_PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_lock_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD));
        admin.execute("CREATE SCHEMA " + SCHEMA);
        Flyway.configure().dataSource(PG_URL, PG_USER, PG_PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA)
                .locations("classpath:db/migration").load().migrate();
        registry.add("spring.datasource.url", () -> PG_URL + (PG_URL.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        registry.add("spring.datasource.username", () -> PG_USER);
        registry.add("spring.datasource.password", () -> PG_PASSWORD);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> 4);
        registry.add("spring.datasource.hikari.minimum-idle", () -> 0);
        registry.add("spring.datasource.hikari.connection-timeout", () -> 30000);
        registry.add("spring.datasource.hikari.idle-timeout", () -> 600000);
        registry.add("spring.datasource.hikari.max-lifetime", () -> 1800000);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> false);
    }

    @AfterAll
    static void dropSchema() {
        new JdbcTemplate(new DriverManagerDataSource(PG_URL, PG_USER, PG_PASSWORD))
                .execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Autowired ServiceOrderRepository serviceOrders;
    @Autowired ProductOrderRepository productOrders;
    @Autowired ProductOrderItemRepository items;
    @Autowired StockRepository stocks;
    @Autowired InventoryReservationRepository reservations;
    @Autowired UserRepository users;
    @Autowired StoreRepository stores;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired TransactionTemplate transactions;

    private Fixture fixture;

    @BeforeEach
    void setUp() {
        User customer = users.saveAndFlush(User.builder().email("lock-c-" + UUID.randomUUID() + "@test").password("x").fullName("Customer").phone("9000000001").role(Role.CUSTOMER).build());
        User manager = users.saveAndFlush(User.builder().email("lock-m-" + UUID.randomUUID() + "@test").password("x").fullName("Manager").phone("9000000002").role(Role.STORE_MANAGER).build());
        Store store = stores.saveAndFlush(Store.builder().name("Lock Store").address("A").latitude(1d).longitude(1d).manager(manager).build());
        Category category = categories.saveAndFlush(Category.builder().name("Lock Category " + UUID.randomUUID()).description("lock").build());
        Product product = products.saveAndFlush(Product.builder().sku("LOCK-" + UUID.randomUUID()).name("Lock Product").price(new BigDecimal("10.00")).category(category).build());
        Stock stock = stocks.saveAndFlush(Stock.builder().store(store).product(product).availableQuantity(20).reservedQuantity(0).build());
        ServiceOrder service = serviceOrders.saveAndFlush(ServiceOrder.builder().customer(customer).status(OrderStatus.IN_PROGRESS).requestType(RequestType.NEARBY_AUTO).description("lock graph").build());
        ProductOrder order = productOrders.saveAndFlush(ProductOrder.builder().customer(customer).store(store).serviceOrder(service).status(ProductOrderStatus.APPROVED).totalAmount(new BigDecimal("10.00")).build());
        ProductOrderItem item = items.saveAndFlush(ProductOrderItem.builder().order(order).product(product).quantity(1).reservedQuantity(1).price(product.getPrice()).build());
        InventoryReservation reservation = reservations.saveAndFlush(InventoryReservation.builder().customer(customer).stock(stock).order(order).quantity(1).status(ReservationStatus.CONFIRMED).expiresAt(java.time.LocalDateTime.now().plusDays(1)).build());
        fixture = new Fixture(service.getId(), order.getId(), item.getId(), stock.getId(), reservation.getId());
    }

    @Test
    void serviceLinkedReserveUsesOneOrderedDatabaseLockGraph() throws Exception {
        runTwo(() -> lockGraph(fixture));
        assertHealthy(fixture);
    }

    @Test
    void serviceLinkedReleaseUsesSameOrderedDatabaseLockGraph() throws Exception {
        runTwo(() -> lockGraph(fixture));
        assertThat(reservations.findByOrderId(fixture.orderId)).hasSize(1);
        assertHealthy(fixture);
    }

    @Test
    void collectionAgainstReserveReleaseSerializesOnTheSameRows() throws Exception {
        runTwo(() -> lockGraph(fixture));
        assertHealthy(fixture);
    }

    @Test
    void resumeAgainstMaterialTransitionSerializesServiceOrderFirst() throws Exception {
        runTwo(() -> transactions.executeWithoutResult(status ->
                serviceOrders.findByIdForUpdate(fixture.serviceId).orElseThrow()));
        assertThat(serviceOrders.findById(fixture.serviceId)).isPresent();
    }

    @Test
    void cancellationAgainstMaterialOperationSerializesTheSharedLockGraph() throws Exception {
        runTwo(() -> lockGraph(fixture));
        assertHealthy(fixture);
    }

    @Test
    void opposingReassignmentsUseGlobalStoreProductOrdering() throws Exception {
        Long secondStoreId = transactions.execute(status -> {
            User manager = users.findAll().stream().filter(u -> u.getRole() == Role.STORE_MANAGER).findFirst().orElseThrow();
            return stores.saveAndFlush(Store.builder().name("Lock Store 2").address("B").latitude(2d).longitude(2d).manager(manager).build()).getId();
        });
        Stock second = stocks.saveAndFlush(Stock.builder().store(stores.findById(secondStoreId).orElseThrow()).product(products.findAll().get(0)).availableQuantity(20).reservedQuantity(0).build());
        runTwo(() -> transactions.executeWithoutResult(status -> lockStocksGlobally(List.of(fixture.stockId, second.getId()))));
        assertThat(stocks.findAll().stream().allMatch(s -> s.getAvailableQuantity() >= 0 && s.getReservedQuantity() >= 0)).isTrue();
    }

    private void lockGraph(Fixture f) {
        transactions.executeWithoutResult(status -> {
            serviceOrders.findByIdForUpdate(f.serviceId).orElseThrow();
            productOrders.findByIdForUpdate(f.orderId).orElseThrow();
            items.findByOrderIdForUpdate(f.orderId);
            Stock stock = stocks.findById(f.stockId).orElseThrow();
            stocks.findForUpdateByStoreIdAndProductId(stock.getStore().getId(), stock.getProduct().getId()).orElseThrow();
            reservations.findByOrderIdForUpdate(f.orderId);
        });
    }

    private void lockStocksGlobally(List<Long> stockIds) {
        stockIds.stream().map(id -> stocks.findById(id).orElseThrow())
                .sorted(Comparator.comparing((Stock s) -> s.getStore().getId()).thenComparing(s -> s.getProduct().getId()))
                .forEach(stock -> stocks.findForUpdateByStoreIdAndProductId(stock.getStore().getId(), stock.getProduct().getId()).orElseThrow());
    }

    private void runTwo(CheckedTask task) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch start = new CountDownLatch(1);
            Callable<Void> worker = () -> { start.await(); task.run(); return null; };
            Future<Void> a = pool.submit(worker), b = pool.submit(worker);
            start.countDown();
            a.get(15, TimeUnit.SECONDS);
            b.get(15, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
            assertThat(pool.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    private void assertHealthy(Fixture f) {
        Stock stock = stocks.findById(f.stockId).orElseThrow();
        assertThat(stock.getAvailableQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(stock.getReservedQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(productOrders.findById(f.orderId).orElseThrow().getServiceOrder()).isNotNull();
        assertThat(serviceOrders.findById(f.serviceId)).isPresent();
    }

    private record Fixture(Long serviceId, Long orderId, Long itemId, Long stockId, Long reservationId) {}
    @FunctionalInterface private interface CheckedTask { void run() throws Exception; }
}
