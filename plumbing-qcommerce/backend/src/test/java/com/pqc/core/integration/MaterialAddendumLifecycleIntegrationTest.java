package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MaterialAddendumLifecycleIntegrationTest extends Phase2QuoteCertificationSupport {

    @Test
    void storePricedAddendumPublishesApprovesAndReplaysWithoutPaymentSideEffects() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "18.25");
        MaterialAddendumCreateRequest create = request(base, material, null, null, null);

        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), create, key("addendum-create")));
        assertThat(draft.state()).isEqualTo("DRAFT");
        assertThat(draft.total()).isEqualByComparingTo("18.25");
        assertThat(draft.lines()).singleElement().satisfies(line -> {
            assertThat(line.lineType()).isEqualTo("MATERIAL");
            assertThat(line.unitPrice()).isEqualByComparingTo("18.25");
        });

        PlumberMaterialAddendumResponse published = as(f.plumber(), () -> quoteService.publishAddendum(
                f.order().getId(), draft.id(), 24, key("addendum-publish")));
        assertThat(published.state()).isEqualTo("PUBLISHED");
        assertThat(quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(f.order().getId(), QuoteKind.MATERIAL_ADDENDUM))
                .extracting(q -> List.of(q.getId(), q.getBaseQuote().getId(), q.getState()))
                .contains(List.of(draft.id(), base.getId(), QuoteState.PUBLISHED));
        assertThat(outboxCount(draft.id())).isEqualTo(1);

        String approvalKey = key("addendum-approve");
        CustomerMaterialAddendumResponse approved = as(f.customer(), () -> quoteService.approveAddendum(
                f.order().getId(), draft.id(), approvalKey));
        CustomerMaterialAddendumResponse replay = as(f.customer(), () -> quoteService.approveAddendum(
                f.order().getId(), draft.id(), approvalKey));
        assertThat(approved.state()).isEqualTo("APPROVED");
        assertThat(replay).isEqualTo(approved);
        assertThat(eventCount(draft.id(), "ADDENDUM_APPROVED")).isEqualTo(1);
        assertThat(outboxCount(draft.id())).isEqualTo(2);
        assertThat(paymentCount(f.order().getId())).isZero();
    }

    @Test
    void correctionSupersedesRejectedAttemptOnlyWhenReplacementPublishes() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem firstItem = material(f, ProductOrderStatus.APPROVED, 1, "10.00");
        PlumberMaterialAddendumResponse first = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, firstItem, null, null, null), key("addendum-first")));
        as(f.plumber(), () -> quoteService.publishAddendum(f.order().getId(), first.id(), 24, key("addendum-first-publish")));
        as(f.customer(), () -> quoteService.rejectAddendum(f.order().getId(), first.id(), new QuoteRejectRequest("wrong part"), key("addendum-first-reject")));

        MaterialItem replacementItem = material(f, ProductOrderStatus.APPROVED, 1, "12.00");
        PlumberMaterialAddendumResponse correction = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, replacementItem, first.id(), null, "Corrected material selection"), key("addendum-correction")));
        assertThat(correction.version()).isEqualTo(2);
        assertThat(quotes.findById(first.id()).orElseThrow().getState()).isEqualTo(QuoteState.REJECTED);
        as(f.plumber(), () -> quoteService.publishAddendum(f.order().getId(), correction.id(), 24, key("addendum-correction-publish")));

        assertThat(quotes.findById(first.id()).orElseThrow().getState()).isEqualTo(QuoteState.SUPERSEDED);
        assertThat(eventCount(first.id(), "ADDENDUM_SUPERSEDED")).isEqualTo(1);
        assertThat(outboxCount(first.id())).isEqualTo(3);
        assertThatThrownBy(() -> as(f.plumber(), () -> quoteService.createAddendum(f.order().getId(),
                request(base, material(f, ProductOrderStatus.APPROVED, 1, "20.00"), first.id(), null, "second correction"), key("second-correction"))))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void rejectsCrossRequestItemOwnershipAndMissingCorrectionReason() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "8.00");
        MaterialAddendumCreateRequest forged = new MaterialAddendumCreateRequest(base.getId(), null, null, null,
                List.of(new MaterialAddendumLineRequest(material.request().getId(), material.item().getId() + 999999, null, BigDecimal.ONE)));
        assertThatThrownBy(() -> as(f.plumber(), () -> quoteService.createAddendum(f.order().getId(), forged, key("bad-item"))))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void expiryTerminalizesPendingLinkAndRejectsApproval() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "9.00");
        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, material, null, null, null), key("expiry-create")));
        as(f.plumber(), () -> quoteService.publishAddendum(f.order().getId(), draft.id(), 24, key("expiry-publish")));
        jdbc.update("UPDATE service_quotes SET published_at=?, expires_at=? WHERE id=?",
                java.time.LocalDateTime.now().minusHours(2), java.time.LocalDateTime.now().minusHours(1), draft.id());
        assertThatThrownBy(() -> as(f.customer(), () -> quoteService.approveAddendum(
                f.order().getId(), draft.id(), key("expiry-approve"))))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(quotes.findById(draft.id()).orElseThrow().getState()).isEqualTo(QuoteState.EXPIRED);
        assertThat(jdbc.queryForObject("SELECT state FROM service_quote_material_links WHERE quote_id=?", String.class, draft.id()))
                .isEqualTo("EXPIRED");
        assertThat(eventCount(draft.id(), "ADDENDUM_EXPIRED")).isEqualTo(1);
        assertThat(outboxCount(draft.id())).isEqualTo(2);
    }

    @Test
    void approvalRejectsUnauthorizedOrAlreadyPackedMaterialsWithoutTransition() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 0, "9.00");
        assertThatThrownBy(() -> as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, material, null, null, null), key("invalid-qty-create"))))
                .isInstanceOf(ResponseStatusException.class);

        MaterialItem packed = material(f, ProductOrderStatus.APPROVED, 1, "9.00");
        packed.item().setPackedQuantity(1);
        productOrderItems.saveAndFlush(packed.item());
        PlumberMaterialAddendumResponse packedDraft = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, packed, null, null, null), key("packed-create")));
        assertThatThrownBy(() -> as(f.plumber(), () -> quoteService.publishAddendum(
                f.order().getId(), packedDraft.id(), 24, key("packed-publish"))))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(quotes.findById(packedDraft.id()).orElseThrow().getState()).isEqualTo(QuoteState.DRAFT);
    }

    @Test
    void draftUpdateReplacesLinksAndOwnershipCannotCrossMaterialRequest() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem first = material(f, ProductOrderStatus.APPROVED, 1, "9.00");
        ProductOrderItem secondItem = productOrderItems.saveAndFlush(ProductOrderItem.builder().order(first.request())
                .product(first.item().getProduct()).quantity(1).reservedQuantity(1).packedQuantity(0)
                .price(new BigDecimal("13.00")).unit("UNIT").build());
        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, first, null, null, null), key("update-create")));
        MaterialAddendumUpdateRequest update = new MaterialAddendumUpdateRequest(first.request().getId(), null,
                List.of(new MaterialAddendumLineRequest(first.request().getId(), secondItem.getId(), null, BigDecimal.ONE)));
        PlumberMaterialAddendumResponse updated = as(f.plumber(), () -> quoteService.updateAddendum(
                f.order().getId(), draft.id(), update, key("update-draft")));
        assertThat(updated.total()).isEqualByComparingTo("13.00");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_material_links WHERE quote_id=?", Integer.class, draft.id())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT material_item_id FROM service_quote_lines WHERE quote_id=?", Long.class, draft.id()))
                .isEqualTo(secondItem.getId());
    }

    @Test
    void serviceOrderCancellationClosesPublishedAddendumAndPendingAuthorizationWithoutAddendumOutbox() {
        Fixture f = fixture();
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "11.00");
        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, material, null, null, null), key("cancel-addendum-create")));
        as(f.plumber(), () -> quoteService.publishAddendum(
                f.order().getId(), draft.id(), 24, key("cancel-addendum-publish")));

        as(f.operator(), () -> orderService.cancelOrder(f.order().getId(), "cancel job"));

        assertThat(quotes.findById(draft.id()).orElseThrow().getState()).isEqualTo(QuoteState.CANCELLED);
        assertThat(jdbc.queryForObject("SELECT state FROM service_quote_material_links WHERE quote_id=?", String.class, draft.id()))
                .isEqualTo("CANCELLED");
        assertThat(eventCount(draft.id(), "ADDENDUM_CANCELLED")).isEqualTo(1);
        assertThat(outboxCount(draft.id())).isEqualTo(1); // publication only; cascade cancellation is audit-only
    }

    @Test
    void concurrentApproveVersusApproveRunsThreeTimesWithOneDecisionAndAuthorization() throws Exception {
        for (int run = 1; run <= 3; run++) {
            Fixture f = fixture();
            PreparedAddendum prepared = publishedAddendum(f, "approve-race-" + run);
            String keyA = key("approve-a"), keyB = key("approve-b");
            Race race = race(f.customer(), () -> quoteService.approveAddendum(f.order().getId(), prepared.id(), keyA),
                    f.customer(), () -> quoteService.approveAddendum(f.order().getId(), prepared.id(), keyB));

            assertThat(race.approved()).isEqualTo(1);
            assertThat(race.conflicts()).isEqualTo(1); // distinct-key competing decision conflicts by contract
            assertRacePersistence(f, prepared, QuoteState.APPROVED, MaterialAuthorizationState.ACTIVE,
                    "ADDENDUM_APPROVED", 1, 1);
            assertThat(idempotencyStatus(f.customer(), "APPROVE_MATERIAL_ADDENDUM", prepared.id(), keyA))
                    .isIn("COMPLETED", "FAILED");
            assertThat(idempotencyStatus(f.customer(), "APPROVE_MATERIAL_ADDENDUM", prepared.id(), keyB))
                    .isIn("COMPLETED", "FAILED");
            assertThat(List.of(idempotencyStatus(f.customer(), "APPROVE_MATERIAL_ADDENDUM", prepared.id(), keyA),
                    idempotencyStatus(f.customer(), "APPROVE_MATERIAL_ADDENDUM", prepared.id(), keyB)))
                    .containsExactlyInAnyOrder("COMPLETED", "FAILED");
        }
    }

    @Test
    void reconciliationApprovalRacesCompletionWithoutLosingCorrectionOrPaymentIsolation() throws Exception {
        for (int run = 1; run <= 3; run++) {
            Fixture f = approvedFixture("reconciliation-approval-race-" + run, "150.00");
            enroll(f);
            ServiceQuote base = quotes.findById(f.quote().getId()).orElseThrow();
            jdbc.update("UPDATE service_orders SET started_at=? WHERE id=?", java.time.LocalDateTime.now().minusMinutes(30), f.order().getId());
            MaterialItem delivered = material(f, ProductOrderStatus.DELIVERED, 1, "100.00");
            assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                    .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reconciliation required");

            PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(f.order().getId(),
                    request(base, delivered, null, null, null), key("reconciliation-race-create")));
            as(f.plumber(), () -> quoteService.publishAddendum(f.order().getId(), draft.id(), 24,
                    key("reconciliation-race-publish")));

            Race race = race(f.customer(), () -> quoteService.approveAddendum(f.order().getId(), draft.id(), key("reconciliation-race-approve")),
                    f.plumber(), () -> orderService.completeOrder(f.order().getId(), null));

            assertThat(race.successes()).isBetween(1L, 2L);
            Phase2Reconciliation row = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
            assertThat(row.getStatus()).isEqualTo(ReconciliationState.RESOLVED);
            assertThat(row.getCorrectionType()).isEqualTo("MATERIAL_ADDENDUM");
            assertThat(row.getCorrectionAddendumId()).isEqualTo(draft.id());
            assertThat(row.getVarianceAmount()).isEqualByComparingTo("0.00");
            if (orders.findById(f.order().getId()).orElseThrow().getStatus() != OrderStatus.COMPLETED)
                as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null));
            assertThat(orders.findById(f.order().getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.COMPLETED);
            assertThat(paymentCount(f.order().getId())).isZero();
        }
    }

    @Test
    void concurrentApproveVersusRejectRunsThreeTimesWithExactlyOneLegalDecision() throws Exception {
        for (int run = 1; run <= 3; run++) {
            Fixture f = fixture();
            PreparedAddendum prepared = publishedAddendum(f, "decision-race-" + run);
            String approveKey = key("approve"), rejectKey = key("reject");
            Race race = race(f.customer(), () -> quoteService.approveAddendum(f.order().getId(), prepared.id(), approveKey),
                    f.customer(), () -> quoteService.rejectAddendum(f.order().getId(), prepared.id(), new QuoteRejectRequest("race reject"), rejectKey));

            assertThat(race.successes()).isEqualTo(1);
            QuoteState state = quotes.findById(prepared.id()).orElseThrow().getState();
            String event = state == QuoteState.APPROVED ? "ADDENDUM_APPROVED" : "ADDENDUM_REJECTED";
            MaterialAuthorizationState linkState = state == QuoteState.APPROVED ? MaterialAuthorizationState.ACTIVE : MaterialAuthorizationState.REJECTED;
            assertThat(state).isIn(QuoteState.APPROVED, QuoteState.REJECTED);
            assertRacePersistence(f, prepared, state, linkState, event, 1, 1);
            assertThat(idempotencyStatus(f.customer(), "APPROVE_MATERIAL_ADDENDUM", prepared.id(), approveKey))
                    .isEqualTo(state == QuoteState.APPROVED ? "COMPLETED" : "FAILED");
            assertThat(idempotencyStatus(f.customer(), "REJECT_MATERIAL_ADDENDUM", prepared.id(), rejectKey))
                    .isEqualTo(state == QuoteState.REJECTED ? "COMPLETED" : "FAILED");
        }
    }

    @Test
    void concurrentApproveVersusLazyExpiryRunsThreeTimesWithOneLegalWinner() throws Exception {
        for (int run = 1; run <= 3; run++) {
            Fixture f = fixture();
            PreparedAddendum prepared = publishedAddendum(f, "expiry-race-" + run);
            jdbc.update("UPDATE service_quotes SET published_at=?, expires_at=? WHERE id=?",
                    java.time.LocalDateTime.now().minusHours(2), java.time.LocalDateTime.now().minusHours(1), prepared.id());
            String approvalKey = key("expiry-approve");
            Race race = race(f.customer(), () -> quoteService.approveAddendum(f.order().getId(), prepared.id(), approvalKey),
                    f.customer(), () -> quoteService.currentAddendum(f.order().getId()));

            QuoteState state = quotes.findById(prepared.id()).orElseThrow().getState();
            assertThat(state).isEqualTo(QuoteState.EXPIRED);
            boolean approved = false; // expires_at is deliberately in the past before the race starts
            assertThat(race.successes()).isEqualTo(1); // expiry read succeeds; approval receives the terminal expiry conflict
            assertRacePersistence(f, prepared, state,
                    approved ? MaterialAuthorizationState.ACTIVE : MaterialAuthorizationState.EXPIRED,
                    approved ? "ADDENDUM_APPROVED" : "ADDENDUM_EXPIRED", 1, approved ? 1 : 0);
            assertThat(idempotencyStatus(f.customer(), "APPROVE_MATERIAL_ADDENDUM", prepared.id(), approvalKey))
                    .isEqualTo(approved ? "COMPLETED" : "FAILED");
        }
    }

    private PreparedAddendum publishedAddendum(Fixture f, String prefix) {
        ServiceQuote base = prepare(f, QuoteState.APPROVED);
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "17.25");
        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(
                f.order().getId(), request(base, material, null, null, null), key(prefix + "-create")));
        as(f.plumber(), () -> quoteService.publishAddendum(
                f.order().getId(), draft.id(), 24, key(prefix + "-publish")));
        return new PreparedAddendum(draft.id(), material.request().getId(), material.item().getId());
    }

    private void assertRacePersistence(Fixture f, PreparedAddendum addendum, QuoteState expectedQuoteState,
                                       MaterialAuthorizationState expectedLinkState, String decisionEvent,
                                       int decisionEvents, int completedIdempotency) {
        assertThat(quotes.findById(addendum.id()).orElseThrow().getState()).isEqualTo(expectedQuoteState);
        assertThat(jdbc.queryForObject("SELECT state FROM service_quote_material_links WHERE quote_id=?", String.class, addendum.id()))
                .isEqualTo(expectedLinkState.name());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_material_links WHERE material_item_id=? AND state='ACTIVE'",
                Integer.class, addendum.itemId())).isEqualTo(expectedLinkState == MaterialAuthorizationState.ACTIVE ? 1 : 0);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_material_links WHERE material_item_id=? AND state IN ('PENDING','ACTIVE')",
                Integer.class, addendum.itemId())).isEqualTo(expectedLinkState == MaterialAuthorizationState.PENDING ? 1 : expectedLinkState == MaterialAuthorizationState.ACTIVE ? 1 : 0);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_quote_material_links l JOIN product_order_items i ON i.id=l.material_item_id JOIN product_orders p ON p.id=i.order_id WHERE l.quote_id=? AND l.material_request_id=p.id AND p.service_order_id=?",
                Integer.class, addendum.id(), f.order().getId())).isEqualTo(1);
        assertThat(eventCount(addendum.id(), decisionEvent)).isEqualTo(decisionEvents);
        assertThat(outboxCount(addendum.id())).isEqualTo(2); // publication + exactly one terminal decision/expiry
        assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE aggregate_type='QUOTE' AND aggregate_id=? AND event_type=?",
                Integer.class, String.valueOf(addendum.id()), decisionEvent)).isEqualTo(decisionEvents);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM phase2_idempotency_keys WHERE resource_type='QUOTE' AND resource_id=? AND status='IN_PROGRESS'",
                Integer.class, addendum.id())).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM phase2_idempotency_keys WHERE resource_type='QUOTE' AND resource_id=? AND operation IN ('APPROVE_MATERIAL_ADDENDUM','REJECT_MATERIAL_ADDENDUM') AND status='COMPLETED'",
                Integer.class, addendum.id())).isEqualTo(completedIdempotency);
        assertThat(paymentCount(f.order().getId())).isZero();
        assertThat(f.order().getStatus()).isNotEqualTo(OrderStatus.PAID);
    }

    private Race race(User leftActor, Callable<?> leftAction, User rightActor, Callable<?> rightAction) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Future<Outcome> a = pool.submit(() -> invoke(leftActor, leftAction, ready, start));
        Future<Outcome> b = pool.submit(() -> invoke(rightActor, rightAction, ready, start));
        try {
            assertThat(ready.await(15, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            return new Race(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
        } catch (TimeoutException timeout) {
            start.countDown(); a.cancel(true); b.cancel(true);
            throw new AssertionError("Addendum race exceeded bounded 15-second future", timeout);
        } finally {
            pool.shutdownNow();
            assertThat(pool.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    private String idempotencyStatus(User actor, String operation, Long addendumId, String key) {
        return jdbc.queryForObject("SELECT status FROM phase2_idempotency_keys WHERE actor_id=? AND operation=? AND resource_type='QUOTE' AND resource_id=? AND idempotency_key=?",
                String.class, actor.getId(), operation, addendumId, key);
    }

    private Outcome invoke(User actor, Callable<?> command, CountDownLatch ready, CountDownLatch start) throws Exception {
        var context = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                actor.getEmail(), null, List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + actor.getRole()))));
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);
        ready.countDown();
        try {
            if (!start.await(15, TimeUnit.SECONDS)) throw new AssertionError("Addendum race start gate timed out");
            return new Outcome(command.call(), null);
        } catch (Throwable failure) {
            for (Throwable t = failure; t != null; t = t.getCause()) {
                String message = String.valueOf(t.getMessage()).toLowerCase(java.util.Locale.ROOT);
                if (message.contains("deadlock") || message.contains("lock timeout") || message.contains("timed out"))
                    throw new AssertionError("Infrastructure failure in addendum race", failure);
            }
            if (failure instanceof ResponseStatusException) return new Outcome(null, failure);
            throw new AssertionError("Unexpected addendum race failure", failure);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    private record PreparedAddendum(Long id, Long requestId, Long itemId) { }
    private record Outcome(Object value, Throwable failure) { }
    private record Race(Outcome left, Outcome right) {
        long successes() { return List.of(left, right).stream().filter(o -> o.failure() == null).count(); }
        long approved() { return List.of(left, right).stream().filter(o -> o.failure() == null && o.value() instanceof CustomerMaterialAddendumResponse r && "APPROVED".equals(r.state())).count(); }
        long conflicts() { return List.of(left, right).stream().filter(o -> o.failure() instanceof ResponseStatusException).count(); }
    }

    private MaterialAddendumCreateRequest request(ServiceQuote base, MaterialItem material,
                                                   Long supersedes, Long catalogId, String reason) {
        return new MaterialAddendumCreateRequest(base.getId(), supersedes, catalogId, reason,
                List.of(new MaterialAddendumLineRequest(material.request().getId(), material.item().getId(), null, BigDecimal.ONE)));
    }

    private Fixture approvedFixture(String prefix, String quoteAmount) {
        Fixture f = fixture();
        enroll(f);
        Catalog priced = catalog(prefix + "-price", new BigDecimal(quoteAmount));
        as(f.plumber(), () -> quoteService.updateDraft(f.order().getId(), f.quote().getId(),
                new QuoteDraftUpdateRequest(priced.lineId(), BigDecimal.ONE), key(prefix + "-edit")));
        as(f.plumber(), () -> quoteService.publish(f.order().getId(), f.quote().getId(),
                new QuotePublishRequest(priced.catalogId(), 24), key(prefix + "-publish")));
        as(f.customer(), () -> quoteService.approve(f.order().getId(), f.quote().getId(), key(prefix + "-approve")));
        return f;
    }

    private MaterialItem material(Fixture f, ProductOrderStatus status, int reserved, String price) {
        Store store = stores.saveAndFlush(Store.builder().name("Addendum Store " + UUID.randomUUID())
                .address("Test").latitude(1d).longitude(1d).manager(f.operator()).build());
        Category category = categories.saveAndFlush(Category.builder().name("Addendum Category " + UUID.randomUUID()).build());
        Product product = products.saveAndFlush(Product.builder().sku("ADD-" + UUID.randomUUID())
                .name("Replacement washer").price(new BigDecimal(price)).category(category).build());
        ProductOrder request = productOrders.saveAndFlush(ProductOrder.builder().customer(f.customer()).store(store)
                .serviceOrder(f.order()).requestedByPlumber(f.plumber()).status(status)
                .totalAmount(new BigDecimal(price)).build());
        ProductOrderItem item = productOrderItems.saveAndFlush(ProductOrderItem.builder().order(request).product(product)
                .quantity(1).reservedQuantity(reserved).packedQuantity(0).price(new BigDecimal(price)).unit("UNIT").build());
        return new MaterialItem(request, item);
    }

    private record MaterialItem(ProductOrder request, ProductOrderItem item) { }
}
