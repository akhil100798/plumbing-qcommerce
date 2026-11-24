package com.pqc.core.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class Phase2StatusWireContractTest {
    @Test
    void phase2StatusesAreStableUppercaseNames() {
        assertThat(java.util.Arrays.stream(DiagnosisState.values()).map(Enum::name).toList())
                .containsExactly("DRAFT", "SUBMITTED", "SUPERSEDED", "CANCELLED");
        assertThat(java.util.Arrays.stream(QuoteState.values()).map(Enum::name).toList())
                .containsExactly("DRAFT", "PUBLISHED", "APPROVED", "REJECTED", "EXPIRED", "SUPERSEDED", "CANCELLED");
        assertThat(java.util.Arrays.stream(QuoteKind.values()).map(Enum::name).toList())
                .containsExactly("INITIAL", "REVISION", "MATERIAL_ADDENDUM");
        assertThat(java.util.Arrays.stream(MaterialAuthorizationState.values()).map(Enum::name).toList())
                .containsExactly("PENDING", "ACTIVE", "SUPERSEDED", "CANCELLED", "REJECTED", "EXPIRED");
        assertThat(java.util.Arrays.stream(ReconciliationState.values()).map(Enum::name).toList())
                .containsExactly("OPEN", "AWAITING_CUSTOMER_APPROVAL", "RESOLVED", "CLOSED_CANCELLED");
        assertThat(java.util.Arrays.stream(Phase2IdempotencyStatus.values()).map(Enum::name).toList())
                .containsExactly("IN_PROGRESS", "COMPLETED", "FAILED");
    }
}
