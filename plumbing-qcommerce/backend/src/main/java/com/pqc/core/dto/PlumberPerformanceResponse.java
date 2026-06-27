package com.pqc.core.dto;
import java.math.BigDecimal;
public record PlumberPerformanceResponse(long completedJobs,long cancelledJobs,long activeJobs,Double averageRating,Long averageCompletionMinutes,BigDecimal totalEarnings,BigDecimal monthlyEarnings,Double responseRate) {}
