package com.pqc.core.integration;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.PlumberMaterialService;
import com.pqc.core.service.ServiceOrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.flywaydb.core.Flyway;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/** Direct production-service concurrency proof on PostgreSQL. */
@SpringBootTest
@ActiveProfiles("test")
class Phase2ServiceOperationConcurrencyIntegrationTest {
    private static final String URL = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER = com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD = com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA = "phase2_service_ops_" + UUID.randomUUID().toString().replace("-", "");

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
    }

    @Autowired PlumberMaterialService materials;
    @Autowired ServiceOrderService orders;
    @Autowired UserRepository users;
    @Autowired StoreRepository stores;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired StockRepository stocks;
    @Autowired ServiceOrderRepository serviceOrders;
    @Autowired ProductOrderRepository productOrders;
    @Autowired ProductOrderItemRepository items;
    @Autowired InventoryReservationRepository reservations;
    @Autowired TransactionTemplate tx;

    @Test
    void reserveVsReserveUsesProductionServices() throws Exception {
        Fixture f = fixture(ProductOrderStatus.APPROVED, 0, false);
        tx.executeWithoutResult(status -> {
            ProductOrderItem pendingItem = items.findByOrderIdForUpdate(f.orderId).get(0);
            pendingItem.setReservedQuantity(1);
            items.saveAndFlush(pendingItem);
        });
        List<Outcome> outcomes = run2(manager(f), () -> materials.reserve(f.orderId));
        assertOnlyDomainOutcomes(outcomes);
        assertInventory(f, 19, 1);
        assertThat(productOrders.findById(f.orderId).orElseThrow().getStatus()).isEqualTo(ProductOrderStatus.RESERVED);
        assertThat(reservations.findByOrderId(f.orderId).stream().filter(this::active).count()).isEqualTo(1);
    }

    @Test
    void materialCancellationVsCancellationReleasesExactlyOnce() throws Exception {
        Fixture f = fixture(ProductOrderStatus.RESERVED, 1, true);
        List<Outcome> outcomes = run2(manager(f), () -> materials.cancelMaterialRequest(f.orderId, "race"));
        assertOnlyDomainOutcomes(outcomes);
        assertInventory(f, 20, 0);
        assertThat(productOrders.findById(f.orderId).orElseThrow().getStatus()).isEqualTo(ProductOrderStatus.CANCELLED);
        assertThat(reservations.findByOrderId(f.orderId).stream().filter(this::active).count()).isZero();
    }

    @Test
    void confirmCollectionVsMaterialCancellationHasOneTerminalWinner() throws Exception {
        Fixture f = fixture(ProductOrderStatus.PLUMBER_AT_STORE, 1, true);
        ProductOrder order = productOrders.findById(f.orderId).orElseThrow();
        order.setPlumberCollectedAt(LocalDateTime.now());
        productOrders.saveAndFlush(order);
        List<Outcome> outcomes = run2(manager(f), () -> {
            try { return materials.confirmCollection(f.orderId); }
            catch (Exception e) { throw e; }
        }, manager(f), () -> materials.cancelMaterialRequest(f.orderId, "race"));
        assertOnlyDomainOutcomes(outcomes);
        Stock stock = stocks.findById(f.stockId).orElseThrow();
        assertThat(stock.getAvailableQuantity()).isGreaterThanOrEqualTo(19).isLessThanOrEqualTo(20);
        assertThat(stock.getReservedQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(productOrders.findById(f.orderId).orElseThrow().getStatus())
                .isIn(ProductOrderStatus.COLLECTED, ProductOrderStatus.CANCELLED);
    }

    @Test
    void resumeVsMaterialUpdateSerializesTheServiceOrder() throws Exception {
        Fixture f = fixture(ProductOrderStatus.REQUESTED, 0, false);
        ServiceOrder resumeJob = serviceOrders.findById(f.serviceId).orElseThrow();
        resumeJob.setStatus(OrderStatus.RETURNING_TO_CUSTOMER);
        serviceOrders.saveAndFlush(resumeJob);
        List<Outcome> outcomes = run2(plumber(f), () -> materials.resume(f.serviceId),
                plumber(f), () -> materials.updateMaterialRequest(f.orderId, f.storeId, List.of(new CartItemDTO(f.productId, 1))));
        assertOnlyDomainOutcomes(outcomes);
        assertThat(serviceOrders.findById(f.serviceId).orElseThrow().getStatus()).isEqualTo(OrderStatus.WORK_RESUMED);
        assertThat(productOrders.findById(f.orderId).orElseThrow().getStatus()).isEqualTo(ProductOrderStatus.REQUESTED);
    }

    @Test
    void serviceCancellationVsMaterialCancellationHasConsistentTerminalState() throws Exception {
        Fixture f = fixture(ProductOrderStatus.RESERVED, 1, true);
        List<Outcome> outcomes = run2(admin(f), () -> orders.cancelOrder(f.serviceId, "race"),
                manager(f), () -> materials.cancelMaterialRequest(f.orderId, "race"));
        assertOnlyDomainOutcomes(outcomes);
        assertThat(serviceOrders.findById(f.serviceId).orElseThrow().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(productOrders.findById(f.orderId).orElseThrow().getStatus()).isEqualTo(ProductOrderStatus.CANCELLED);
        assertInventory(f, 20, 0);
    }

    @Test
    void opposingAdminReassignmentsInvokeTheRealService() throws Exception {
        Fixture f = fixture(ProductOrderStatus.RESERVED, 1, true);
        Store second = stores.saveAndFlush(Store.builder().name("Store-2-" + UUID.randomUUID()).address("B").latitude(2d).longitude(2d).manager(f.manager).build());
        stocks.saveAndFlush(Stock.builder().store(second).product(products.findById(f.productId).orElseThrow()).availableQuantity(20).reservedQuantity(0).build());
        // First call targets the second store; the second call targets the original store.
        List<Outcome> outcomes = run2(admin(f), () -> materials.adminReassignStore(f.orderId, second.getId()),
                admin(f), () -> materials.adminReassignStore(f.orderId, f.storeId));
        assertOnlyDomainOutcomes(outcomes);
        Stock a = stocks.findByStoreIdAndProductId(f.storeId, f.productId).orElseThrow();
        Stock b = stocks.findByStoreIdAndProductId(second.getId(), f.productId).orElseThrow();
        assertThat(a.getAvailableQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(b.getAvailableQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(a.getReservedQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(b.getReservedQuantity()).isGreaterThanOrEqualTo(0);
        ProductOrder finalOrder = productOrders.findById(f.orderId).orElseThrow();
        assertThat(finalOrder.getStore().getId()).isIn(f.storeId, second.getId());
        assertThat(reservations.findByOrderId(f.orderId).stream().filter(this::active).count()).isEqualTo(1);
    }

    private Fixture fixture(ProductOrderStatus status, int reserved, boolean reservation) {
        User customer = user(Role.CUSTOMER, "customer");
        User plumber = user(Role.PLUMBER, "plumber");
        User manager = user(Role.STORE_MANAGER, "manager");
        User admin = user(Role.ADMIN, "admin");
        Store store = stores.saveAndFlush(Store.builder().name("Store-" + UUID.randomUUID()).address("A").latitude(1d).longitude(1d).manager(manager).build());
        Category category = categories.saveAndFlush(Category.builder().name("Category-" + UUID.randomUUID()).description("test").build());
        Product product = products.saveAndFlush(Product.builder().sku("SKU-" + UUID.randomUUID()).name("Product").price(new BigDecimal("10")).category(category).build());
        Stock stock = stocks.saveAndFlush(Stock.builder().store(store).product(product).availableQuantity(20 - reserved).reservedQuantity(reserved).build());
        ServiceOrder service = serviceOrders.saveAndFlush(ServiceOrder.builder().customer(customer).plumber(plumber).store(store).status(OrderStatus.MATERIALS_REQUIRED).requestType(RequestType.NEARBY_AUTO).description("test").build());
        ProductOrder order = productOrders.saveAndFlush(ProductOrder.builder().customer(customer).store(store).serviceOrder(service).requestedByPlumber(plumber).status(status).totalAmount(new BigDecimal("10")).build());
        items.saveAndFlush(ProductOrderItem.builder().order(order).product(product).quantity(1).reservedQuantity(reserved).price(product.getPrice()).build());
        if (reservation) reservations.saveAndFlush(InventoryReservation.builder().customer(customer).stock(stock).order(order).quantity(1).status(ReservationStatus.CONFIRMED).expiresAt(LocalDateTime.now().plusDays(1)).build());
        return new Fixture(customer, plumber, manager, admin, service.getId(), order.getId(), store.getId(), product.getId(), stock.getId());
    }

    private User user(Role role, String prefix) { return users.saveAndFlush(User.builder().email(prefix + "-" + UUID.randomUUID() + "@test").password("x").fullName(prefix).phone("9" + Math.abs(UUID.randomUUID().hashCode())).role(role).build()); }
    private boolean active(InventoryReservation r) { return r.getStatus() == ReservationStatus.CONFIRMED; }
    private void assertInventory(Fixture f, int available, int reserved) { Stock s = stocks.findById(f.stockId).orElseThrow(); assertThat(s.getAvailableQuantity()).isEqualTo(available); assertThat(s.getReservedQuantity()).isEqualTo(reserved); }

    private List<Outcome> run2(User actor, Checked first) throws Exception { return run2(actor, first, actor, first); }
    private List<Outcome> run2(User a, Checked first, User b, Checked second) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch start = new CountDownLatch(1);
        Callable<Outcome> ca = () -> invoke(a, start, first), cb = () -> invoke(b, start, second);
        Future<Outcome> fa = pool.submit(ca), fb = pool.submit(cb); start.countDown();
        try { return List.of(fa.get(15, TimeUnit.SECONDS), fb.get(15, TimeUnit.SECONDS)); }
        finally { pool.shutdownNow(); assertThat(pool.awaitTermination(5, TimeUnit.SECONDS)).isTrue(); }
    }
    private Outcome invoke(User actor, CountDownLatch start, Checked action) throws Exception {
        start.await();
        authenticate(actor);
        try {
            action.run();
            return Outcome.SUCCESS;
        } catch (RuntimeException e) {
            if (isInfrastructureFailure(e)) {
                throw new AssertionError("Concurrency infrastructure failure", e);
            }
            return Outcome.DOMAIN_FAILURE;
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private boolean isInfrastructureFailure(Throwable failure) {
        for (Throwable current = failure; current != null; current = current.getCause()) {
            String type = current.getClass().getName();
            String message = String.valueOf(current.getMessage()).toLowerCase(Locale.ROOT);
            if (type.contains("PessimisticLock") || type.contains("CannotAcquireLock")
                    || type.contains("TransactionSystem") || type.contains("UnexpectedRollback")
                    || message.contains("deadlock") || message.contains("lock timeout")
                    || message.contains("could not serialize") || message.contains("transaction is aborted")
                    || message.contains("rollback-only")) {
                return true;
            }
        }
        return false;
    }
    private void assertOnlyDomainOutcomes(List<Outcome> outcomes) {
        assertThat(outcomes).hasSize(2).allMatch(o -> o == Outcome.SUCCESS || o == Outcome.DOMAIN_FAILURE);
    }
    private void authenticate(User u) { SecurityContext context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(new UsernamePasswordAuthenticationToken(u.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())))); SecurityContextHolder.setContext(context); }
    private User plumber(Fixture f) { return f.plumber; } private User manager(Fixture f) { return f.manager; } private User admin(Fixture f) { return f.admin; }

    private enum Outcome { SUCCESS, DOMAIN_FAILURE }
    @FunctionalInterface private interface Checked { Object run() throws Exception; }
    private record Fixture(User customer, User plumber, User manager, User admin, Long serviceId, Long orderId, Long storeId, Long productId, Long stockId) {}
}
