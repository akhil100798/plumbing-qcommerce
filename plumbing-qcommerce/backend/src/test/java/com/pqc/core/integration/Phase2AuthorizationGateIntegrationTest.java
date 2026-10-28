package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Phase2AuthorizationGateIntegrationTest extends Phase2QuoteCertificationSupport {

    @Test
    void approvedBaseQuoteAllowsResumeAndZeroVarianceCompletionWithoutReconciliation() {
        Fixture f = approvedFixture("resume-allowed", "150.00");
        setReturning(f);
        assertThat(as(f.plumber(), () -> plumberMaterialService.resume(f.order().getId())).getStatus())
                .isEqualTo(OrderStatus.WORK_RESUMED);
        ServiceOrder completed = as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null));
        assertThat(completed.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(completed.getLaborCharge()).isEqualByComparingTo("150.00");
        assertThat(reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId())).isEmpty();
    }

    @Test
    void positiveVariancePersistsOneReconciliationAndDoesNotMutateOrderOrPayment() {
        Fixture f = approvedFixture("positive-variance", "100.00");
        setStarted(f, LocalDateTime.now().minusHours(4));
        OrderStatus before = orders.findById(f.order().getId()).orElseThrow().getStatus();

        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("reconciliation required");

        assertThat(orders.findById(f.order().getId()).orElseThrow().getStatus()).isEqualTo(before);
        assertThat(reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()))
                .singleElement().satisfies(r -> {
                    assertThat(r.getStatus()).isEqualTo(ReconciliationState.OPEN);
                    assertThat(r.getAuthorizedRepairAmount()).isEqualByComparingTo("100.00");
                    assertThat(r.getVarianceAmount()).isPositive();
                });
        assertThat(paymentCount(f.order().getId())).isZero();
        assertThat(outbox.findAll().stream().filter(e -> "SERVICE_ORDER".equals(e.getAggregateType())
                && String.valueOf(f.order().getId()).equals(e.getAggregateId())
                && "ORDER_COMPLETED".equals(e.getEventType())).count()).isZero();

        Phase2Reconciliation firstAttempt = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        jdbc.update("UPDATE service_orders SET started_at=? WHERE id=?",
                LocalDateTime.now().minusHours(5), f.order().getId());
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()))
                .singleElement().satisfies(r -> {
                    assertThat(r.getStatus()).isEqualTo(ReconciliationState.OPEN);
                    assertThat(r.getAuthorizedRepairAmount()).isEqualByComparingTo(firstAttempt.getAuthorizedRepairAmount());
                    assertThat(r.getLegacyRepairAmount()).isEqualByComparingTo(firstAttempt.getLegacyRepairAmount());
                    assertThat(r.getVarianceAmount()).isEqualByComparingTo(firstAttempt.getVarianceAmount());
                });
    }

    @Test
    void customerApprovedMaterialCorrectionRefreshesAndResolvesTheLiveSnapshot() {
        Fixture f = approvedFixture("material-correction-exact", "150.00");
        setStarted(f, LocalDateTime.now().minusMinutes(30)); // 150 labor against 100 authorization
        MaterialItem material = material(f, ProductOrderStatus.DELIVERED, 1, "100.00");
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reconciliation required");
        Phase2Reconciliation original = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        assertThat(original.getVarianceAmount()).isEqualByComparingTo("100.00");

        ServiceQuote addendum = approveMaterialCorrection(f, material);
        Phase2Reconciliation corrected = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        assertThat(corrected.getId()).isEqualTo(original.getId());
        assertThat(corrected.getStatus()).isEqualTo(ReconciliationState.RESOLVED);
        assertThat(corrected.getCorrectionType()).isEqualTo("MATERIAL_ADDENDUM");
        assertThat(corrected.getCorrectionAddendumId()).isEqualTo(addendum.getId());
        assertThat(corrected.getAuthorizedRepairAmount()).isEqualByComparingTo("250.00");
        assertThat(corrected.getLegacyRepairAmount()).isEqualByComparingTo("250.00");
        assertThat(corrected.getVarianceAmount()).isEqualByComparingTo("0.00");
        assertThat(corrected.getResolvedAt()).isNotNull();
        assertThat(paymentCount(f.order().getId())).isZero();
    }

    @Test
    void partialMaterialCorrectionStaysOpenAndCannotCoverLaborVariance() {
        Fixture f = approvedFixture("material-correction-partial", "150.00");
        setStarted(f, LocalDateTime.now().minusMinutes(60)); // 300 labor against 150 authorization
        MaterialItem material = material(f, ProductOrderStatus.DELIVERED, 1, "100.00");
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reconciliation required");
        Phase2Reconciliation original = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);

        ServiceQuote addendum = approveMaterialCorrection(f, material);
        Phase2Reconciliation corrected = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        assertThat(corrected.getId()).isEqualTo(original.getId());
        assertThat(corrected.getStatus()).isEqualTo(ReconciliationState.OPEN);
        assertThat(corrected.getCorrectionType()).isEqualTo("MATERIAL_ADDENDUM");
        assertThat(corrected.getCorrectionAddendumId()).isEqualTo(addendum.getId());
        assertThat(corrected.getAuthorizedRepairAmount()).isEqualByComparingTo("250.00");
        assertThat(corrected.getLegacyRepairAmount()).isEqualByComparingTo("400.00");
        assertThat(corrected.getVarianceAmount()).isEqualByComparingTo("150.00");
        assertThat(corrected.getResolvedAt()).isNull();
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reconciliation required");
        assertThat(paymentCount(f.order().getId())).isZero();
    }

    @Test
    void overCorrectionMayResolveWhenItIsCoveredByMaterialVariance() {
        Fixture f = approvedFixture("material-correction-over", "200.00");
        setStarted(f, LocalDateTime.now().minusMinutes(30)); // actual 250, initial variance 50, material variance 100
        MaterialItem material = material(f, ProductOrderStatus.DELIVERED, 1, "100.00");
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reconciliation required");

        ServiceQuote addendum = approveMaterialCorrection(f, material);
        Phase2Reconciliation corrected = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        assertThat(corrected.getCorrectionAddendumId()).isEqualTo(addendum.getId());
        assertThat(corrected.getStatus()).isEqualTo(ReconciliationState.RESOLVED);
        assertThat(corrected.getAuthorizedRepairAmount()).isEqualByComparingTo("300.00");
        assertThat(corrected.getLegacyRepairAmount()).isEqualByComparingTo("250.00");
        assertThat(corrected.getVarianceAmount()).isEqualByComparingTo("-50.00");
        assertThat(paymentCount(f.order().getId())).isZero();
    }

    @Test
    void materialAddendumCannotResolveLaborOnlyVariance() {
        Fixture f = approvedFixture("material-correction-labor-only", "100.00");
        setStarted(f, LocalDateTime.now().minusHours(4));
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reconciliation required");
        Phase2Reconciliation original = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);

        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "100.00");
        ServiceQuote addendum = approveMaterialCorrection(f, material);
        Phase2Reconciliation unchanged = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        assertThat(addendum.getState()).isEqualTo(QuoteState.APPROVED);
        assertThat(unchanged.getId()).isEqualTo(original.getId());
        assertThat(unchanged.getStatus()).isEqualTo(ReconciliationState.OPEN);
        assertThat(unchanged.getCorrectionType()).isNull();
        assertThat(unchanged.getCorrectionAddendumId()).isNull();
        assertThat(unchanged.getVarianceAmount()).isEqualByComparingTo(original.getVarianceAmount());
        assertThat(paymentCount(f.order().getId())).isZero();
    }

    @Test
    void laterLowerActualAmountDoesNotBypassAnExistingPositiveReconciliation() {
        Fixture f = approvedFixture("variance-cannot-self-resolve", "500.00");
        setStarted(f, LocalDateTime.now().minusHours(4));

        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("reconciliation required");
        Phase2Reconciliation initial = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);

        // Even if the recalculated legacy amount falls below authorization later,
        // the existing attempt cannot be resolved without an explicit correction.
        setStarted(f, LocalDateTime.now());
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Customer-approved correction did not cover the reconciliation snapshot");

        assertThat(orders.findById(f.order().getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.IN_PROGRESS);
        assertThat(reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()))
                .singleElement().satisfies(row -> {
                    assertThat(row.getStatus()).isEqualTo(ReconciliationState.OPEN);
                    assertThat(row.getId()).isEqualTo(initial.getId());
                    assertThat(row.getVarianceAmount()).isEqualByComparingTo(initial.getVarianceAmount());
                });
        assertThat(paymentCount(f.order().getId())).isZero();
    }

    @Test
    void negativeVarianceCompletesAtActualLowerAmountAndIsAudited() {
        Fixture f = approvedFixture("lower-variance", "800.00");
        setStarted(f, LocalDateTime.now().minusMinutes(61));

        ServiceOrder completed = as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null));

        assertThat(completed.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(completed.getTotalAmount().compareTo(new BigDecimal("800.00"))).isNegative();
        assertThat(completed.getTotalAmount()).isEqualByComparingTo(
                completed.getLaborCharge().add(completed.getPartsCharge()).add(completed.getPlatformFee()));
        assertThat(reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()))
                .singleElement().satisfies(row -> {
                    assertThat(row.getStatus()).isEqualTo(ReconciliationState.RESOLVED);
                    assertThat(row.getVarianceAmount()).isNegative();
                    assertThat(row.getResolution()).contains("no refund or credit");
                });
    }

    @Test
    void enrolledOrderRejectsUnapprovedPlumberExtraChargeBeforeCompletion() {
        Fixture f = approvedFixture("unapproved-extra", "1000.00");
        setStarted(f, LocalDateTime.now().minusMinutes(30));

        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(
                f.order().getId(), new BigDecimal("1.00"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Extra charge is not represented");

        assertThat(orders.findById(f.order().getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.IN_PROGRESS);
        assertThat(paymentCount(f.order().getId())).isZero();
        assertThat(reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId())).isEmpty();
    }

    @Test
    void cancellationClosesLiveReconciliationAndPreservesAttemptAmounts() {
        Fixture f = approvedFixture("cancel-reconciliation", "100.00");
        setStarted(f, LocalDateTime.now().minusHours(4));
        assertThatThrownBy(() -> as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null)))
                .isInstanceOf(ResponseStatusException.class);
        Phase2Reconciliation before = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);

        as(f.admin(), () -> orderService.cancelOrder(f.order().getId(), "customer cancelled after variance"));

        Phase2Reconciliation closed = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(f.order().getId()).get(0);
        assertThat(closed.getStatus()).isEqualTo(ReconciliationState.CLOSED_CANCELLED);
        assertThat(closed.getCorrectionType()).isEqualTo("CANCEL");
        assertThat(closed.getResolvedAt()).isNotNull();
        assertThat(closed.getAuthorizedRepairAmount()).isEqualByComparingTo(before.getAuthorizedRepairAmount());
        assertThat(closed.getLegacyRepairAmount()).isEqualByComparingTo(before.getLegacyRepairAmount());
    }

    @Test
    void requiredPublishedRejectedAndExpiredAddendaBlockResume() {
        for (QuoteState state : List.of(QuoteState.PUBLISHED, QuoteState.REJECTED, QuoteState.EXPIRED)) {
            Fixture f = approvedFixture("addendum-gate-" + state, "500.00");
            ServiceQuote base = quotes.findById(f.quote().getId()).orElseThrow();
            MaterialAddendum prepared = createAddendum(f, base, state);
            setReturning(f);
            assertThatThrownBy(() -> as(f.plumber(), () -> plumberMaterialService.resume(f.order().getId())))
                    .as("required addendum %s blocks resume", state)
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("authorization is incomplete");
            assertThat(orders.findById(f.order().getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.RETURNING_TO_CUSTOMER);
        }
    }

    @Test
    void approvedRequiredAddendumContributesOnceAndAllowsResume() {
        Fixture f = approvedFixture("addendum-approved-gate", "500.00");
        ServiceQuote base = quotes.findById(f.quote().getId()).orElseThrow();
        MaterialAddendum addendum = createAddendum(f, base, QuoteState.APPROVED);
        setStarted(f, LocalDateTime.now().minusMinutes(60));
        setReturning(f);
        var snapshot = tx.execute(status -> phase2Authorization.recalculate(
                orders.findByIdForUpdate(f.order().getId()).orElseThrow(), null, true));
        assertThat(snapshot.authorizedRepairAmount()).isEqualByComparingTo(base.getAmount().add(addendum.quote().getAmount()));
        assertThat(as(f.plumber(), () -> plumberMaterialService.resume(f.order().getId())).getStatus())
                .isEqualTo(OrderStatus.WORK_RESUMED);
    }

    @Test
    void unenrolledLegacyOrderKeepsPhaseOneResumeAndCompletion() {
        Fixture f = fixture();
        enrollments.delete(enrollments.findByServiceOrderId(f.order().getId()).orElseThrow());
        setStarted(f, LocalDateTime.now().minusMinutes(30));
        setReturning(f);
        assertThat(as(f.plumber(), () -> plumberMaterialService.resume(f.order().getId())).getStatus())
                .isEqualTo(OrderStatus.WORK_RESUMED);
        ServiceOrder completed = as(f.plumber(), () -> orderService.completeOrder(f.order().getId(), null));
        assertThat(completed.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    private Fixture approvedFixture(String prefix, String quoteAmount) {
        Fixture f = fixture();
        enroll(f);
        ServiceQuote quote = quotes.findById(f.quote().getId()).orElseThrow();
        // fixture() has one catalog line; replace the draft snapshot through the normal quote edit API.
        Catalog priced = catalog(prefix + "-price", new BigDecimal(quoteAmount));
        as(f.plumber(), () -> quoteService.updateDraft(f.order().getId(), quote.getId(),
                new QuoteDraftUpdateRequest(priced.lineId(), BigDecimal.ONE), key(prefix + "-edit")));
        as(f.plumber(), () -> quoteService.publish(f.order().getId(), quote.getId(),
                new QuotePublishRequest(priced.catalogId(), 24), key(prefix + "-publish")));
        as(f.customer(), () -> quoteService.approve(f.order().getId(), quote.getId(), key(prefix + "-approve")));
        return f;
    }

    private MaterialAddendum createAddendum(Fixture f, ServiceQuote base, QuoteState target) {
        MaterialItem material = material(f, ProductOrderStatus.APPROVED, 1, "75.00");
        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(f.order().getId(),
                new MaterialAddendumCreateRequest(base.getId(), null, null, null,
                        List.of(new MaterialAddendumLineRequest(material.request().getId(), material.item().getId(), null, BigDecimal.ONE))),
                key("gate-addendum-create")));
        as(f.plumber(), () -> quoteService.publishAddendum(f.order().getId(), draft.id(), 24, key("gate-addendum-publish")));
        if (target == QuoteState.APPROVED) {
            as(f.customer(), () -> quoteService.approveAddendum(f.order().getId(), draft.id(), key("gate-addendum-approve")));
        } else if (target == QuoteState.REJECTED) {
            as(f.customer(), () -> quoteService.rejectAddendum(f.order().getId(), draft.id(), new QuoteRejectRequest("not approved"), key("gate-addendum-reject")));
        } else if (target == QuoteState.EXPIRED) {
            jdbc.update("UPDATE service_quotes SET published_at=?, expires_at=? WHERE id=?",
                    LocalDateTime.now().minusHours(2), LocalDateTime.now().minusHours(1), draft.id());
            as(f.customer(), () -> quoteService.currentAddendum(f.order().getId()));
        }
        ServiceQuote quote = quotes.findById(draft.id()).orElseThrow();
        return new MaterialAddendum(quote, material);
    }

    private ServiceQuote approveMaterialCorrection(Fixture f, MaterialItem material) {
        ServiceQuote base = quotes.findById(f.quote().getId()).orElseThrow();
        PlumberMaterialAddendumResponse draft = as(f.plumber(), () -> quoteService.createAddendum(f.order().getId(),
                new MaterialAddendumCreateRequest(base.getId(), null, null, null,
                        List.of(new MaterialAddendumLineRequest(material.request().getId(), material.item().getId(), null, BigDecimal.ONE))),
                key("reconciliation-correction-create")));
        as(f.plumber(), () -> quoteService.publishAddendum(f.order().getId(), draft.id(), 24,
                key("reconciliation-correction-publish")));
        as(f.customer(), () -> quoteService.approveAddendum(f.order().getId(), draft.id(),
                key("reconciliation-correction-approve")));
        return quotes.findById(draft.id()).orElseThrow();
    }

    private void setStarted(Fixture f, LocalDateTime started) {
        jdbc.update("UPDATE service_orders SET started_at=? WHERE id=?", started, f.order().getId());
    }

    private void setReturning(Fixture f) {
        jdbc.update("UPDATE service_orders SET status='RETURNING_TO_CUSTOMER' WHERE id=?", f.order().getId());
    }

    private MaterialItem material(Fixture f, ProductOrderStatus status, int reserved, String price) {
        Store store = stores.saveAndFlush(Store.builder().name("Gate Store " + UUID.randomUUID())
                .address("Test").latitude(1d).longitude(1d).manager(f.operator()).build());
        Category category = categories.saveAndFlush(Category.builder().name("Gate Category " + UUID.randomUUID()).build());
        Product product = products.saveAndFlush(Product.builder().sku("GATE-" + UUID.randomUUID())
                .name("Gate washer").price(new BigDecimal(price)).category(category).build());
        ProductOrder request = productOrders.saveAndFlush(ProductOrder.builder().customer(f.customer()).store(store)
                .serviceOrder(f.order()).requestedByPlumber(f.plumber()).status(status)
                .totalAmount(new BigDecimal(price)).build());
        ProductOrderItem item = productOrderItems.saveAndFlush(ProductOrderItem.builder().order(request).product(product)
                .quantity(1).reservedQuantity(reserved).packedQuantity(0).price(new BigDecimal(price)).unit("UNIT").build());
        return new MaterialItem(request, item);
    }

    private record MaterialItem(ProductOrder request, ProductOrderItem item) { }
    private record MaterialAddendum(ServiceQuote quote, MaterialItem material) { }
}
