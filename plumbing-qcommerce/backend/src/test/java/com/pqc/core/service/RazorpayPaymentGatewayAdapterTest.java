package com.pqc.core.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RazorpayPaymentGatewayAdapterTest {

    @Test
    void isLiveConfigured_returnsFalseWhenCredentialsAbsentOrDummy() {
        RazorpayPaymentGatewayAdapter emptyAdapter = new RazorpayPaymentGatewayAdapter("", "", "");
        assertThat(emptyAdapter.isLiveConfigured()).isFalse();

        RazorpayPaymentGatewayAdapter dummyAdapter = new RazorpayPaymentGatewayAdapter("dummy_key", "dummy_secret", "dummy_wh");
        assertThat(dummyAdapter.isLiveConfigured()).isFalse();

        RazorpayPaymentGatewayAdapter placeholderAdapter = new RazorpayPaymentGatewayAdapter("rzp_test_placeholder", "placeholder_sec", "");
        assertThat(placeholderAdapter.isLiveConfigured()).isFalse();
    }

    @Test
    void isLiveConfigured_returnsTrueWhenRealCredentialsProvided() {
        RazorpayPaymentGatewayAdapter liveAdapter = new RazorpayPaymentGatewayAdapter("rzp_live_abc12345", "sec_live_987654321", "whsec_real");
        assertThat(liveAdapter.isLiveConfigured()).isTrue();
    }

    @Test
    void createCheckoutOrder_inSandboxMode_generatesSimulatedOrderWithoutRemoteCall() {
        RazorpayPaymentGatewayAdapter sandboxAdapter = new RazorpayPaymentGatewayAdapter("", "", "");
        var order = sandboxAdapter.createCheckoutOrder(88L, new BigDecimal("1200.50"), "INR");

        assertThat(order).isNotNull();
        assertThat(order.orderId()).isEqualTo(88L);
        assertThat(order.razorpayOrderId()).startsWith("order_sim_");
        assertThat(order.amount()).isEqualByComparingTo("1200.50");
        assertThat(order.amountInPaise()).isEqualTo(120050L);
        assertThat(order.currency()).isEqualTo("INR");
        assertThat(order.keyId()).isNotBlank();
    }

    @Test
    void createCheckoutOrder_withInvalidAmountOrNullOrder_throwsIllegalArgumentException() {
        RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("", "", "");

        assertThatThrownBy(() -> adapter.createCheckoutOrder(null, new BigDecimal("100"), "INR"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Order ID cannot be null");

        assertThatThrownBy(() -> adapter.createCheckoutOrder(10L, BigDecimal.ZERO, "INR"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payment amount must be positive");

        assertThatThrownBy(() -> adapter.createCheckoutOrder(10L, new BigDecimal("-10"), "INR"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payment amount must be positive");
    }

    @Test
    void capturePayment_inSandboxMode_returnsSimulatedPaymentId() {
        RazorpayPaymentGatewayAdapter sandboxAdapter = new RazorpayPaymentGatewayAdapter("", "", "");
        String paymentId = sandboxAdapter.capturePayment(44L, new BigDecimal("499.00"), "pay_instrument", "INR", "idem-44");

        assertThat(paymentId).isNotNull().startsWith("pay_sim_");
    }

    @Test
    void processPayout_inSandboxMode_returnsSimulatedPayoutId() {
        RazorpayPaymentGatewayAdapter sandboxAdapter = new RazorpayPaymentGatewayAdapter("", "", "");
        String payoutId = sandboxAdapter.processPayout(12L, "PLUMBER", new BigDecimal("1500.00"));

        assertThat(payoutId).isNotNull().startsWith("pout_sim_");
    }

    @Test
    void verifyPaymentSignature_withRealSecret_verifiesCorrectHmacSha256() {
        String secret = "rzp_secret_key_12345";
        RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_test_key", secret, "");

        String rzpOrderId = "order_EKwxwAgItmmXdp";
        String rzpPaymentId = "pay_29QQoUBi66xm2f";
        String validSignature = adapter.calculateHmacSha256(rzpOrderId + "|" + rzpPaymentId, secret);

        assertThat(adapter.verifyPaymentSignature(rzpOrderId, rzpPaymentId, validSignature)).isTrue();
        assertThat(adapter.verifyPaymentSignature(rzpOrderId, rzpPaymentId, "invalid_sig_abc")).isFalse();
    }

    @Test
    void verifyWebhookSignature_withRealSecret_verifiesCorrectHmacSha256() {
        String webhookSecret = "whsec_test_secret_abc123";
        RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_test_key", "sec_123", webhookSecret);

        String rawPayload = "{\"event\":\"payment.captured\",\"account_id\":\"acc_123\",\"entity\":\"event\"}";
        String validSignature = adapter.calculateHmacSha256(rawPayload, webhookSecret);

        assertThat(adapter.verifyWebhookSignature(rawPayload, validSignature)).isTrue();
        assertThat(adapter.verifyWebhookSignature(rawPayload, "invalid_tampered_signature")).isFalse();
        assertThat(adapter.verifyWebhookSignature(rawPayload + "tampered", validSignature)).isFalse();
    }

    @Test
    void verifyWebhookSignature_withMissingOrBlankSignature_returnsFalse() {
        RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_test_key", "sec_123", "whsec_123");

        assertThat(adapter.verifyWebhookSignature("{\"event\":\"test\"}", null)).isFalse();
        assertThat(adapter.verifyWebhookSignature("{\"event\":\"test\"}", "   ")).isFalse();
        assertThat(adapter.verifyWebhookSignature(null, "some_sig")).isFalse();
    }

    @Test
    void verifyWebhookSignature_inSandboxModeWithoutSecret_acceptsSimulatedSignaturesOnly() {
        RazorpayPaymentGatewayAdapter sandboxAdapter = new RazorpayPaymentGatewayAdapter("", "", "");

        assertThat(sandboxAdapter.verifyWebhookSignature("payload", "sim_signature_123")).isTrue();
        assertThat(sandboxAdapter.verifyWebhookSignature("payload", "valid_signature")).isTrue();
        assertThat(sandboxAdapter.verifyWebhookSignature("payload", "random_untrusted_signature")).isFalse();
    }
}
