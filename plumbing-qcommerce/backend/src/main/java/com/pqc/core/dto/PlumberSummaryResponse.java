package com.pqc.core.dto;
import com.pqc.core.entity.*; import java.math.BigDecimal; import java.time.LocalDateTime;
public record PlumberSummaryResponse(Long plumberId,String fullName,String phone,String email,PlumberAvailabilityStatus availabilityStatus,PlumberKycStatus kycStatus,Double rating,long completedJobs,long activeJobs,BigDecimal totalEarnings,LocalDateTime joinedAt) {}
