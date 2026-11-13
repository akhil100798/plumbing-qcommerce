package com.pqc.core.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Phase2QuoteImmutabilityIntegrationTest extends Phase2QuoteCertificationSupport {
    private static final List<QuoteState> STATES = List.of(QuoteState.DRAFT, QuoteState.PUBLISHED, QuoteState.APPROVED,
            QuoteState.REJECTED, QuoteState.EXPIRED, QuoteState.SUPERSEDED, QuoteState.CANCELLED);
    private static final String[] MATRIX_COMMANDS = {"Edit", "Publish", "Approve", "Reject", "Revise"};

    @Test void terminalStateCommandMatrixAndEveryNonDraftSnapshotAreImmutable() {
        Map<String, String> observed = new LinkedHashMap<>();
        for (QuoteState state : STATES) {
            String[] result = new String[MATRIX_COMMANDS.length];
            for (int i = 0; i < MATRIX_COMMANDS.length; i++) {
                Fixture fixture = fixture();
                ServiceQuote quote = prepare(fixture, state);
                Snapshot before = snapshot(quote.getId());
                long eventsBefore = eventCount(quote.getId());
                long outboxBefore = outboxCount(quote.getId());
                Attempt attempt = command(fixture, quote, MATRIX_COMMANDS[i], key("matrix-" + state + "-" + i));
                result[i] = attempt.allowed() ? "ALLOWED" : "REJECTED";
                assertThat(attempt.allowed()).as(state + " " + MATRIX_COMMANDS[i]).isEqualTo(expected(state, MATRIX_COMMANDS[i]));
                if (state != QuoteState.DRAFT) {
                    assertThat(financialSnapshot(snapshot(quote.getId()))).isEqualTo(financialSnapshot(before));
                    if (!attempt.allowed()) {
                        assertThat(snapshot(quote.getId())).isEqualTo(before);
                        assertThat(eventCount(quote.getId())).isEqualTo(eventsBefore);
                        assertThat(outboxCount(quote.getId())).isEqualTo(outboxBefore);
                    }
                }
                assertThat(paymentCount(fixture.order().getId())).isZero();
            }
            observed.put(state.name(), String.join(" | ", result));
        }

        assertThat(observed).containsEntry("DRAFT", "ALLOWED | ALLOWED | REJECTED | REJECTED | REJECTED");
        assertThat(observed).containsEntry("PUBLISHED", "REJECTED | REJECTED | ALLOWED | ALLOWED | ALLOWED");
        assertThat(observed).containsEntry("REJECTED", "REJECTED | REJECTED | REJECTED | REJECTED | ALLOWED");
        for (QuoteState state : List.of(QuoteState.APPROVED, QuoteState.EXPIRED, QuoteState.SUPERSEDED, QuoteState.CANCELLED)) {
            assertThat(observed.get(state.name())).isEqualTo("REJECTED | REJECTED | REJECTED | REJECTED | REJECTED");
        }
    }

    @Test void publishIsRejectedFromEveryNonDraftStateWithoutSecondPublicationEvent() {
        for (QuoteState state : STATES.subList(1, STATES.size())) {
            Fixture fixture = fixture();
            ServiceQuote quote = prepare(fixture, state);
            Snapshot before = snapshot(quote.getId());
            long publishedEvents = eventCount(quote.getId(), "QUOTE_PUBLISHED");
            long eventRows = eventCount(quote.getId());
            long outboxRows = outboxCount(quote.getId());

            assertRejected(command(fixture, quote, "Publish", key("non-draft-publish")));

            assertThat(snapshot(quote.getId())).isEqualTo(before);
            assertThat(eventCount(quote.getId(), "QUOTE_PUBLISHED")).isEqualTo(publishedEvents);
            assertThat(eventCount(quote.getId())).isEqualTo(eventRows);
            assertThat(outboxCount(quote.getId())).isEqualTo(outboxRows);
        }
    }

    @Test void revisionEligibilityMatrixEnforcesCurrentInitialPublishedUndecidedUnexpiredAndOneRevision() {
        Map<String, Boolean> eligible = new LinkedHashMap<>();
        for (QuoteState state : STATES) {
            Fixture fixture = fixture();
            ServiceQuote source = prepare(fixture, state);
            Attempt attempt = attempt(() -> as(fixture.plumber(), () -> quoteService.revise(fixture.order().getId(), source.getId(),
                    new QuoteRevisionRequest("revision eligibility"), key("revision-matrix-" + state))));
            boolean expected = state == QuoteState.PUBLISHED || state == QuoteState.REJECTED;
            assertThat(attempt.allowed()).as("revision source state " + state).isEqualTo(expected);
            eligible.put(state.name(), attempt.allowed());
            if (expected) {
                assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(fixture.order().getId()))
                        .filteredOn(q -> q.getQuoteKind() == QuoteKind.REVISION).hasSize(1);
            } else if (state == QuoteState.SUPERSEDED) {
                // Preparing SUPERSEDED creates the one permitted replacement revision.
                assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(fixture.order().getId()))
                        .filteredOn(q -> q.getQuoteKind() == QuoteKind.REVISION).hasSize(1);
            } else {
                assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(fixture.order().getId()))
                        .filteredOn(q -> q.getQuoteKind() == QuoteKind.REVISION).isEmpty();
            }
        }
        assertThat(eligible).containsEntry("DRAFT", false).containsEntry("PUBLISHED", true)
                .containsEntry("APPROVED", false).containsEntry("REJECTED", true)
                .containsEntry("EXPIRED", false).containsEntry("SUPERSEDED", false).containsEntry("CANCELLED", false);

        Fixture revisionSourceFixture = fixture();
        ServiceQuote initial = published(revisionSourceFixture);
        PlumberQuoteResponse revision = as(revisionSourceFixture.plumber(), () -> quoteService.revise(revisionSourceFixture.order().getId(), initial.getId(),
                new QuoteRevisionRequest("first revision"), key("revision-source-first")));
        assertThatThrownBy(() -> as(revisionSourceFixture.plumber(), () -> quoteService.revise(revisionSourceFixture.order().getId(), revision.id(),
                new QuoteRevisionRequest("revision of revision"), key("revision-of-revision"))))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> as(revisionSourceFixture.plumber(), () -> quoteService.revise(revisionSourceFixture.order().getId(), initial.getId(),
                new QuoteRevisionRequest("second revision"), key("revision-second"))))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(quotes.findByServiceOrderIdOrderByVersionAsc(revisionSourceFixture.order().getId()))
                .filteredOn(q -> q.getQuoteKind() == QuoteKind.REVISION).hasSize(1);
    }

    @Test void currentCustomerQuoteFilteringExposesOnlyTheContractualLatestDecisionRecord() {
        Fixture draftFixture = fixture();
        assertCurrentUnavailable(draftFixture);

        for (QuoteState state : List.of(QuoteState.PUBLISHED, QuoteState.APPROVED, QuoteState.REJECTED, QuoteState.EXPIRED)) {
            Fixture fixture = fixture();
            ServiceQuote quote = prepare(fixture, state);
            CustomerQuoteResponse current = as(fixture.customer(), () -> quoteService.current(fixture.order().getId()));
            assertThat(current.id()).isEqualTo(quote.getId());
            assertThat(current.state()).isEqualTo(state.name());
        }

        Fixture cancelledFixture = fixture();
        prepare(cancelledFixture, QuoteState.CANCELLED);
        assertCurrentUnavailable(cancelledFixture);

        Fixture revisionFixture = fixture();
        ServiceQuote original = published(revisionFixture);
        PlumberQuoteResponse revisionResponse = as(revisionFixture.plumber(), () -> quoteService.revise(revisionFixture.order().getId(), original.getId(),
                new QuoteRevisionRequest("single correction"), key("filter-revision")));
        as(revisionFixture.plumber(), () -> quoteService.updateDraft(revisionFixture.order().getId(), revisionResponse.id(),
                new QuoteDraftUpdateRequest(revisionFixture.catalog().lineId(), java.math.BigDecimal.ONE), key("filter-revision-edit")));
        as(revisionFixture.plumber(), () -> quoteService.publish(revisionFixture.order().getId(), revisionResponse.id(),
                new QuotePublishRequest(revisionFixture.catalog().catalogId(), 24), key("filter-revision-publish")));
        CustomerQuoteResponse current = as(revisionFixture.customer(), () -> quoteService.current(revisionFixture.order().getId()));
        assertThat(current.id()).isEqualTo(revisionResponse.id());
        assertThat(current.kind()).isEqualTo(QuoteKind.REVISION.name());
        assertThat(current.state()).isEqualTo(QuoteState.PUBLISHED.name());
        assertThat(current.id()).isNotEqualTo(original.getId());
        assertThatThrownBy(() -> as(revisionFixture.customer(), () -> quoteService.adminHistory(revisionFixture.order().getId())))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test void responseDtosSerializeOnlyIntentionalRoleScopedFields() throws Exception {
        Fixture fixture = fixture();
        ServiceQuote published = published(fixture);
        CustomerQuoteResponse customer = as(fixture.customer(), () -> quoteService.current(fixture.order().getId()));
        PlumberQuoteResponse plumber = as(fixture.plumber(), () -> quoteService.plumberRead(fixture.order().getId(), published.getId()));
        String customerJson = new ObjectMapper().findAndRegisterModules().writeValueAsString(customer);
        String plumberJson = new ObjectMapper().findAndRegisterModules().writeValueAsString(plumber);
        String adminJson = new ObjectMapper().findAndRegisterModules().writeValueAsString(as(fixture.operator(), () -> adminQuoteController.history(fixture.order().getId()).getBody()));

        assertThat(customerJson).contains("\"total\"", "\"lines\"", "\"state\"")
                .doesNotContain("optimisticVersion", "idempotency", "fingerprint", "eventId", "outbox", "pricingCatalog", "storage", "stackTrace", "lock", "customerId", "plumberId", "phone", "email");
        assertThat(plumberJson).contains("\"pricingCatalogVersion\"", "\"unitPrice\"", "\"lineTotal\"")
                .doesNotContain("optimisticVersion", "idempotency", "fingerprint", "eventId", "outbox", "storage", "stackTrace", "lock", "phone", "email", "password");
        assertThat(adminJson).contains("\"quoteId\"", "\"supersededAt\"")
                .doesNotContain("optimisticVersion", "idempotency", "fingerprint", "eventId", "outbox", "storage", "stackTrace", "lock", "phone", "email", "password");
    }

    private void assertCurrentUnavailable(Fixture fixture) {
        assertThatThrownBy(() -> as(fixture.customer(), () -> quoteService.current(fixture.order().getId())))
                .satisfies(error -> assertThat(rootCause(error)).isInstanceOf(ResponseStatusException.class)
                        .satisfies(root -> assertThat(((ResponseStatusException) root).getStatusCode().value()).isEqualTo(404)));
    }

    private Attempt command(Fixture f, ServiceQuote q, String command, String key) {
        return attempt(() -> {
            switch (command) {
                case "Edit" -> as(f.plumber(), () -> quoteService.updateDraft(f.order().getId(), q.getId(),
                        new QuoteDraftUpdateRequest(f.catalog().lineId(), java.math.BigDecimal.ONE), key));
                case "Publish" -> as(f.plumber(), () -> quoteService.publish(f.order().getId(), q.getId(),
                        new QuotePublishRequest(f.catalog().catalogId(), 24), key));
                case "Approve" -> as(f.customer(), () -> quoteService.approve(f.order().getId(), q.getId(), key));
                case "Reject" -> as(f.customer(), () -> quoteService.reject(f.order().getId(), q.getId(), new QuoteRejectRequest("no"), key));
                case "Revise" -> as(f.plumber(), () -> quoteService.revise(f.order().getId(), q.getId(), new QuoteRevisionRequest("test"), key));
                default -> throw new IllegalArgumentException(command);
            }
            return null;
        });
    }

    private Attempt attempt(Callable<?> action) {
        try {
            action.call();
            return new Attempt(true, null);
        } catch (Exception error) {
            Throwable root = rootCause(error);
            return new Attempt(false, root instanceof RuntimeException runtime ? runtime : new RuntimeException(root));
        }
    }

    private boolean expected(QuoteState state, String command) {
        if (state == QuoteState.DRAFT) return command.equals("Edit") || command.equals("Publish");
        if (state == QuoteState.PUBLISHED) return Set.of("Approve", "Reject", "Revise").contains(command);
        if (state == QuoteState.REJECTED) return command.equals("Revise");
        return false;
    }

    private void assertRejected(Attempt attempt) {
        assertThat(attempt.allowed()).isFalse();
        Throwable root = rootCause(attempt.error());
        assertThat(root).isInstanceOfAny(ResponseStatusException.class, AccessDeniedException.class);
        if (root instanceof ResponseStatusException status) assertThat(status.getStatusCode().value()).isBetween(400, 499);
    }

    private Map<String, Object> financialSnapshot(Snapshot snapshot) {
        Map<String, Object> q = snapshot.quote();
        Map<String, Object> result = new LinkedHashMap<>();
        for (String field : List.of("amount", "labor_subtotal", "known_material_subtotal", "currency", "pricing_catalog_id", "pricing_catalog_version", "published_at", "expires_at", "immutable_snapshot_at")) {
            result.put(field, q.get(field));
        }
        result.put("lines", snapshot.lines());
        return result;
    }

    private Throwable rootCause(Throwable error) {
        Throwable current = error;
        while (current.getCause() != null) current = current.getCause();
        return current;
    }

    private record Attempt(boolean allowed, RuntimeException error) { }
}
