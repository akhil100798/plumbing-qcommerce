package com.pqc.core.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MockPaymentGatewayAdapterTest {

    @Test
    void allowsSimulatedTransactionsInNonProdProfiles() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        MockPaymentGatewayAdapter adapter = new MockPaymentGatewayAdapter(env);

        String txId = adapter.capturePayment(1L, new BigDecimal("100.00"), "pm_card_valid", "INR", "idem-1");
        assertThat(txId).startsWith("ch_mock_");

        String payoutId = adapter.processPayout(2L, "PLUMBER", new BigDecimal("50.00"));
        assertThat(payoutId).startsWith("po_mock_");
    }

    @Test
    void allowsSimulatedTransactionsWhenNoProfileConfigured() {
        MockPaymentGatewayAdapter adapter = new MockPaymentGatewayAdapter();

        String txId = adapter.capturePayment(1L, new BigDecimal("100.00"), "pm_card_valid", "INR", "idem-1");
        assertThat(txId).startsWith("ch_mock_");
    }

    @Test
    void strictlyRefusesCaptureInProductionProfile() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        MockPaymentGatewayAdapter adapter = new MockPaymentGatewayAdapter(env);

        assertThatThrownBy(() -> adapter.capturePayment(1L, new BigDecimal("100.00"), "pm_card_valid", "INR", "idem-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CRITICAL SECURITY VIOLATION")
                .hasMessageContaining("production environment");
    }

    @Test
    void strictlyRefusesPayoutInProductionProfile() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        MockPaymentGatewayAdapter adapter = new MockPaymentGatewayAdapter(env);

        assertThatThrownBy(() -> adapter.processPayout(2L, "PLUMBER", new BigDecimal("50.00")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CRITICAL SECURITY VIOLATION")
                .hasMessageContaining("production environment");
    }

    @Test
    void failsOnFailureSimulatingInstrument() {
        MockPaymentGatewayAdapter adapter = new MockPaymentGatewayAdapter();

        assertThatThrownBy(() -> adapter.capturePayment(1L, new BigDecimal("100.00"), "pm_fail_test", "INR", "idem-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("invalid instrument state");
    }
}
