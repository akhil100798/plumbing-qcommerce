package com.pqc.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@Slf4j
public class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {

    @Override
    public String capturePayment(Long orderId, BigDecimal amount, String paymentMethodId) {
        log.info("MockPaymentGateway: Capturing payment for order #{} of amount {} using instrument {}", 
                orderId, amount, paymentMethodId);
        
        if (paymentMethodId != null && paymentMethodId.contains("fail")) {
            throw new RuntimeException("MockPaymentGateway: payment capture failed due to invalid instrument state.");
        }
        
        return "ch_mock_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Override
    public String processPayout(Long userId, String role, BigDecimal amount) {
        log.info("MockPaymentGateway: Initiating payout for user #{} ({}) of amount {}", 
                userId, role, amount);
        
        return "po_mock_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
