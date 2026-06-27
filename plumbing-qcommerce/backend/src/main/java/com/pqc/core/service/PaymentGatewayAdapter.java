package com.pqc.core.service;

import java.math.BigDecimal;

public interface PaymentGatewayAdapter {
    /**
     * Captures a payment from a customer.
     *
     * @param orderId          The order reference.
     * @param amount           The charge amount.
     * @param paymentMethodId  The payment instrument ID.
     * @return The transaction reference/ID.
     */
    String capturePayment(Long orderId, BigDecimal amount, String paymentMethodId);

    /**
     * Triggers payout to plumbers or store managers.
     *
     * @param userId  The target recipient.
     * @param role    The user role (e.g. PLUMBER or STORE_MANAGER).
     * @param amount  Payout amount.
     * @return Payout transfer reference.
     */
    String processPayout(Long userId, String role, BigDecimal amount);
}
