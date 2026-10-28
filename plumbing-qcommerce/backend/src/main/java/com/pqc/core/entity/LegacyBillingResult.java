package com.pqc.core.entity;

import java.math.BigDecimal;

public record LegacyBillingResult(BigDecimal laborCharge, BigDecimal deliveredPartsTotal, BigDecimal partsCharge,
                                  BigDecimal approvedExtraCharge, BigDecimal referralCommission,
                                  BigDecimal platformFee, BigDecimal totalAmount) { }
