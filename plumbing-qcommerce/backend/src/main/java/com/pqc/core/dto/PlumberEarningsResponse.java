package com.pqc.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlumberEarningsResponse {
    private BigDecimal todayEarnings;
    private BigDecimal weeklyEarnings;
    private BigDecimal serviceCommission;
    private BigDecimal materialCommission;
    private BigDecimal tips;
    private int jobsCompleted;
}
