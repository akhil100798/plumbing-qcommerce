package com.pqc.core.dto;
import com.pqc.core.entity.*; import java.math.BigDecimal; import java.time.LocalDateTime; import java.util.List;
public record PlumberDetailResponse(Long plumberId,String fullName,String phone,String email,LocalDateTime joinedAt,PlumberKycStatus kycStatus,PlumberAvailabilityStatus availabilityStatus,long totalJobs,long activeJobs,long completedJobs,Double averageRating,BigDecimal totalEarnings,BigDecimal monthlyEarnings,List<PlumberJobSummaryResponse> recentServiceJobs,List<String> recentComplaints) {}
