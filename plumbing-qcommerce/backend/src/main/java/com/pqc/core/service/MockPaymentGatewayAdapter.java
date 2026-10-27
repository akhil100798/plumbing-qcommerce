package com.pqc.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.UUID;

@Component
@Slf4j
public class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {

    private final Environment environment;

    public MockPaymentGatewayAdapter() {
        this.environment = null;
    }

    @Autowired
    public MockPaymentGatewayAdapter(Environment environment) {
        this.environment = environment;
    }

    private void assertNotProd() {
        if (environment != null && Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: MockPaymentGatewayAdapter cannot process transactions in production environment!");
        }
    }

    @Override
    public String capturePayment(Long orderId, BigDecimal amount, String paymentMethodId, String currency,
                                 String idempotencyKey) {
        assertNotProd();
        log.info("MockPaymentGateway: Capturing payment for order #{} of amount {} using instrument {}", 
                orderId, amount, paymentMethodId);
        
        if (paymentMethodId != null && paymentMethodId.contains("fail")) {
            throw new RuntimeException("MockPaymentGateway: payment capture failed due to invalid instrument state.");
        }
        
        return "ch_mock_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Override
    public String processPayout(Long userId, String role, BigDecimal amount) {
        assertNotProd();
        log.info("MockPaymentGateway: Initiating payout for user #{} ({}) of amount {}", 
                userId, role, amount);
        
        return "po_mock_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
