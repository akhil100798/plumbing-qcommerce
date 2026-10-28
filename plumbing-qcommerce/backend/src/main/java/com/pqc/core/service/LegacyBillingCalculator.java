package com.pqc.core.service;

import com.pqc.core.entity.LegacyBillingResult;
import java.math.*;

public class LegacyBillingCalculator {
    private static final BigDecimal RATE = new BigDecimal("300.00");
    private static final BigDecimal PLATFORM = new BigDecimal("50.00");

    public LegacyBillingResult calculate(long minutesWorked, BigDecimal deliveredPartsTotal, BigDecimal extraCharge) {
        BigDecimal parts = scale(deliveredPartsTotal);
        BigDecimal approvedExtra = scale(extraCharge);
        BigDecimal labor = RATE.multiply(BigDecimal.valueOf(Math.max(0.5, minutesWorked / 60.0))).setScale(2, RoundingMode.HALF_UP);
        BigDecimal partsCharge = parts.add(approvedExtra).setScale(2, RoundingMode.HALF_UP);
        BigDecimal referral = parts.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        return new LegacyBillingResult(labor, parts, partsCharge, approvedExtra, referral, PLATFORM,
                labor.add(partsCharge).add(PLATFORM).setScale(2, RoundingMode.HALF_UP));
    }
    private BigDecimal scale(BigDecimal value) { return value == null ? BigDecimal.ZERO.setScale(2) : value.setScale(2, RoundingMode.HALF_UP); }
}
