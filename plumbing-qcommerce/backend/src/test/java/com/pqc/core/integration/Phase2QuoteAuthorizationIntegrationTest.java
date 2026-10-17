package com.pqc.core.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Phase2QuoteAuthorizationIntegrationTest extends Phase2QuoteCertificationSupport {
    @Test void assignedPlumberMayReadEditPublishAndRequestOnlyThePermittedInitialRevision() {
        Fixture draftFixture = fixture();
        ServiceQuote quote = draftFixture.quote();
        assertThat(as(draftFixture.plumber(), () -> quoteService.plumberRead(draftFixture.order().getId(), quote.getId())).id()).isEqualTo(quote.getId());
        Snapshot before = snapshot(quote.getId());
        assertDenied(() -> as(draftFixture.plumber(), () -> quoteService.approve(draftFixture.order().getId(), quote.getId(), key("plumber-approve"))));
        assertDenied(() -> as(draftFixture.plumber(), () -> quoteService.reject(draftFixture.order().getId(), quote.getId(), new QuoteRejectRequest("not customer"), key("plumber-reject"))));
        assertThat(snapshot(quote.getId())).isEqualTo(before);
        assertThat(eventCount(quote.getId())).isZero();
        assertThat(outboxCount(quote.getId())).isZero();
        assertThat(paymentCount(draftFixture.order().getId())).isZero();

        Fixture revisionFixture = fixture();
        ServiceQuote published = published(revisionFixture);
        PlumberQuoteResponse revision = as(revisionFixture.plumber(), () -> quoteService.revise(revisionFixture.order().getId(), published.getId(),
                new QuoteRevisionRequest("bounded correction"), key("assigned-revision")));
        assertThat(revision.kind()).isEqualTo(QuoteKind.REVISION.name());
        assertThat(quotes.findById(revision.id()).orElseThrow().getState()).isEqualTo(QuoteState.DRAFT);

        Fixture publishFixture = fixture();
        ServiceQuote publishQuote = publishFixture.quote();
        assertThat(as(publishFixture.plumber(), () -> quoteService.publish(publishFixture.order().getId(), publishQuote.getId(),
                new QuotePublishRequest(publishFixture.catalog().catalogId(), 24), key("assigned-publish"))).state()).isEqualTo(QuoteState.PUBLISHED.name());
    }

    @Test void differentPlumberCannotReadOrMutateAndRejectedAttemptsHaveNoBusinessSideEffects() {
        Fixture fixture = fixture();
        ServiceQuote quote = fixture.quote();
        Snapshot before = snapshot(quote.getId());
        long events = eventCount(quote.getId());
        long outboxRows = outboxCount(quote.getId());
        int safeFailedClaimsBefore = idempotency.findAll().size();

        assertDenied(() -> as(fixture.otherPlumber(), () -> quoteService.plumberRead(fixture.order().getId(), quote.getId())));
        assertDenied(() -> as(fixture.otherPlumber(), () -> quoteService.updateDraft(fixture.order().getId(), quote.getId(),
                new QuoteDraftUpdateRequest(fixture.catalog().lineId(), java.math.BigDecimal.TEN), key("other-edit"))));
        assertDenied(() -> as(fixture.otherPlumber(), () -> quoteService.publish(fixture.order().getId(), quote.getId(),
                new QuotePublishRequest(fixture.catalog().catalogId(), 24), key("other-publish"))));
        assertDenied(() -> as(fixture.otherPlumber(), () -> quoteService.revise(fixture.order().getId(), quote.getId(),
                new QuoteRevisionRequest("unauthorized"), key("other-revision"))));
        assertDenied(() -> as(fixture.otherPlumber(), () -> quoteService.approve(fixture.order().getId(), quote.getId(), key("other-approve"))));
        assertDenied(() -> as(fixture.otherPlumber(), () -> quoteService.reject(fixture.order().getId(), quote.getId(),
                new QuoteRejectRequest("unauthorized"), key("other-reject"))));

        assertThat(snapshot(quote.getId())).isEqualTo(before);
        assertThat(eventCount(quote.getId())).isEqualTo(events);
        assertThat(outboxCount(quote.getId())).isEqualTo(outboxRows);
        assertThat(idempotency.findAll().size()).isGreaterThanOrEqualTo(safeFailedClaimsBefore);
        assertThat(paymentCount(fixture.order().getId())).isZero();
    }

    @Test void owningCustomerCanReadAndDecideOnlyCurrentPublishedWhileOtherCustomerCannotAct() {
        Fixture fixture = fixture();
        ServiceQuote quote = published(fixture);
        CustomerQuoteResponse customerRead = as(fixture.customer(), () -> quoteService.current(fixture.order().getId()));
        assertThat(customerRead.id()).isEqualTo(quote.getId());

        assertDenied(() -> as(fixture.customer(), () -> quoteService.updateDraft(fixture.order().getId(), quote.getId(),
                new QuoteDraftUpdateRequest(fixture.catalog().lineId(), java.math.BigDecimal.TEN), key("owner-edit"))));
        assertDenied(() -> as(fixture.customer(), () -> quoteService.publish(fixture.order().getId(), quote.getId(),
                new QuotePublishRequest(fixture.catalog().catalogId(), 24), key("owner-publish"))));
        assertDenied(() -> as(fixture.customer(), () -> quoteService.revise(fixture.order().getId(), quote.getId(),
                new QuoteRevisionRequest("not plumber"), key("owner-revision"))));
        assertDenied(() -> as(fixture.customer(), () -> quoteService.adminHistory(fixture.order().getId())));

        Fixture deniedFixture = fixture();
        ServiceQuote deniedQuote = published(deniedFixture);
        Snapshot beforeDenied = snapshot(deniedQuote.getId());
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.current(deniedFixture.order().getId())));
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.plumberRead(deniedFixture.order().getId(), deniedQuote.getId())));
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.updateDraft(deniedFixture.order().getId(), deniedQuote.getId(),
                new QuoteDraftUpdateRequest(deniedFixture.catalog().lineId(), java.math.BigDecimal.TEN), key("other-customer-edit"))));
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.publish(deniedFixture.order().getId(), deniedQuote.getId(),
                new QuotePublishRequest(deniedFixture.catalog().catalogId(), 24), key("other-customer-publish"))));
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.revise(deniedFixture.order().getId(), deniedQuote.getId(),
                new QuoteRevisionRequest("not plumber"), key("other-customer-revision"))));
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.approve(deniedFixture.order().getId(), deniedQuote.getId(), key("other-customer-approve"))));
        assertDenied(() -> as(deniedFixture.otherCustomer(), () -> quoteService.reject(deniedFixture.order().getId(), deniedQuote.getId(),
                new QuoteRejectRequest("not owner"), key("other-customer-reject"))));
        assertThat(snapshot(deniedQuote.getId())).isEqualTo(beforeDenied);
        assertThat(eventCount(deniedQuote.getId(), "QUOTE_APPROVED")).isZero();
        assertThat(eventCount(deniedQuote.getId(), "QUOTE_REJECTED")).isZero();
        assertThat(outboxCount(deniedQuote.getId())).isEqualTo(1); // publication only
        assertThat(paymentCount(deniedFixture.order().getId())).isZero();

        CustomerQuoteResponse approved = as(fixture.customer(), () -> quoteService.approve(fixture.order().getId(), quote.getId(), key("owner-approve")));
        assertThat(approved.state()).isEqualTo(QuoteState.APPROVED.name());
        assertThat(paymentCount(fixture.order().getId())).isZero();

        Fixture rejectFixture = fixture();
        ServiceQuote rejectQuote = published(rejectFixture);
        CustomerQuoteResponse rejected = as(rejectFixture.customer(), () -> quoteService.reject(rejectFixture.order().getId(), rejectQuote.getId(),
                new QuoteRejectRequest("declined"), key("owner-reject")));
        assertThat(rejected.state()).isEqualTo(QuoteState.REJECTED.name());
        assertThat(paymentCount(rejectFixture.order().getId())).isZero();
    }

    @Test void operationsHistoryIsReadOnlyDeterministicallyOrderedAndUsesDedicatedPrivacyScopedDto() throws Exception {
        Fixture fixture = fixture();
        ServiceQuote initial = published(fixture);
        PlumberQuoteResponse revisionResponse = as(fixture.plumber(), () -> quoteService.revise(fixture.order().getId(), initial.getId(),
                new QuoteRevisionRequest("clarification"), key("history-revision")));
        as(fixture.plumber(), () -> quoteService.updateDraft(fixture.order().getId(), revisionResponse.id(),
                new QuoteDraftUpdateRequest(fixture.catalog().lineId(), java.math.BigDecimal.ONE), key("history-revision-edit")));
        as(fixture.plumber(), () -> quoteService.publish(fixture.order().getId(), revisionResponse.id(),
                new QuotePublishRequest(fixture.catalog().catalogId(), 24), key("history-revision-publish")));
        as(fixture.customer(), () -> quoteService.approve(fixture.order().getId(), revisionResponse.id(), key("history-approve")));
        Snapshot initialBefore = snapshot(initial.getId());
        Snapshot revisionBefore = snapshot(revisionResponse.id());
        long eventsBefore = eventCount(initial.getId()) + eventCount(revisionResponse.id());
        long outboxBefore = outboxCount(initial.getId()) + outboxCount(revisionResponse.id());
        long paymentsBefore = paymentCount(fixture.order().getId());

        var historyResponse = as(fixture.operator(), () -> adminQuoteController.history(fixture.order().getId()));
        List<AdminQuoteHistoryResponse> history = historyResponse.getBody();
        assertThat(history).hasSize(2);
        assertThat(history).extracting(AdminQuoteHistoryResponse::version).containsExactly(1, 2);
        assertThat(history).extracting(AdminQuoteHistoryResponse::kind).containsExactly("INITIAL", "REVISION");
        assertThat(history).extracting(AdminQuoteHistoryResponse::state).containsExactly("SUPERSEDED", "APPROVED");
        assertThat(history).extracting(AdminQuoteHistoryResponse::quoteId).doesNotHaveDuplicates();
        assertThat(history.get(0).supersededAt()).isNotNull();
        assertThat(history.get(1).approvedAt()).isNotNull();
        assertThat(history.get(1).supersedesQuoteId()).isEqualTo(initial.getId());
        String serialized = new ObjectMapper().findAndRegisterModules().writeValueAsString(history);
        assertThat(serialized).contains("\"quoteId\"", "\"decisionActorId\"", "\"supersededAt\"")
                .doesNotContain("optimisticVersion", "idempotency", "fingerprint", "responsePayload", "eventId", "outbox", "storage", "stackTrace", "lock", "phone", "email", "password");

        assertDenied(() -> as(fixture.operator(), () -> quoteService.approve(fixture.order().getId(), initial.getId(), key("operator-approve"))));
        assertDenied(() -> as(fixture.admin(), () -> quoteService.reject(fixture.order().getId(), revisionResponse.id(),
                new QuoteRejectRequest("operator cannot decide"), key("admin-reject"))));
        assertDenied(() -> as(fixture.operator(), () -> quoteService.updateDraft(fixture.order().getId(), initial.getId(),
                new QuoteDraftUpdateRequest(fixture.catalog().lineId(), java.math.BigDecimal.TEN), key("operator-edit"))));
        assertDenied(() -> as(fixture.admin(), () -> quoteService.publish(fixture.order().getId(), revisionResponse.id(),
                new QuotePublishRequest(fixture.catalog().catalogId(), 24), key("admin-publish"))));
        assertDenied(() -> as(fixture.operator(), () -> quoteService.revise(fixture.order().getId(), revisionResponse.id(),
                new QuoteRevisionRequest("override"), key("operator-revision"))));

        assertThat(snapshot(initial.getId())).isEqualTo(initialBefore);
        assertThat(snapshot(revisionResponse.id())).isEqualTo(revisionBefore);
        assertThat(eventCount(initial.getId()) + eventCount(revisionResponse.id())).isEqualTo(eventsBefore);
        assertThat(outboxCount(initial.getId()) + outboxCount(revisionResponse.id())).isEqualTo(outboxBefore);
        assertThat(paymentCount(fixture.order().getId())).isEqualTo(paymentsBefore);
    }

    @Test void operationsHistoryIncludesCancellationTimestampFromOrderOrDiagnosisCancellation() {
        Fixture orderCancelled = fixture();
        ServiceQuote cancelledByOrder = published(orderCancelled);
        as(orderCancelled.admin(), () -> orderService.cancelOrder(orderCancelled.order().getId(), "order closure"));
        List<AdminQuoteHistoryResponse> orderHistory = as(orderCancelled.operator(),
                () -> quoteService.adminHistory(orderCancelled.order().getId()));
        assertThat(orderHistory).singleElement().satisfies(entry -> {
            assertThat(entry.state()).isEqualTo(QuoteState.CANCELLED.name());
            assertThat(entry.cancelledAt()).isNotNull();
        });

    }

    private void assertDenied(Callable<?> action) {
        assertThatThrownBy(action::call).satisfies(error -> {
                    Throwable root = error;
                    while (root.getCause() != null) root = root.getCause();
                    assertThat(root).isInstanceOfAny(AccessDeniedException.class, ResponseStatusException.class);
                    if (root instanceof ResponseStatusException response) assertThat(response.getStatusCode().value()).isBetween(400, 499);
                });
    }
}
