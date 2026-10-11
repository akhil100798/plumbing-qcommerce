package com.pqc.core.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;

class LegacyBillingCalculatorTest {
    private final LegacyBillingCalculator calculator = new LegacyBillingCalculator();

    @Test
    void preservesCurrentCompletionArithmetic() {
        var result = calculator.calculate(60, new BigDecimal("100.00"), new BigDecimal("25.00"));
        assertThat(result.laborCharge()).isEqualByComparingTo("300.00");
        assertThat(result.deliveredPartsTotal()).isEqualByComparingTo("100.00");
        assertThat(result.partsCharge()).isEqualByComparingTo("125.00");
        assertThat(result.approvedExtraCharge()).isEqualByComparingTo("25.00");
        assertThat(result.referralCommission()).isEqualByComparingTo("10.00");
        assertThat(result.platformFee()).isEqualByComparingTo("50.00");
        assertThat(result.totalAmount()).isEqualByComparingTo("475.00");
    }

    @Test
    void appliesMinimumHalfHour() {
        assertThat(calculator.calculate(0, BigDecimal.ZERO, null).laborCharge()).isEqualByComparingTo("150.00");
    }
}
