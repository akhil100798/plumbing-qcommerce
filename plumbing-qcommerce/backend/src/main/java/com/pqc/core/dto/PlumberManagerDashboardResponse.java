package com.pqc.core.dto;
import java.math.BigDecimal;
public record PlumberManagerDashboardResponse(long totalPlumbers,long onlinePlumbers,long busyPlumbers,long offlinePlumbers,long suspendedPlumbers,long pendingKyc,long approvedKyc,long rejectedKyc,long activeJobs,long completedJobsToday,Double averageRating,BigDecimal totalEarningsThisMonth) {}
