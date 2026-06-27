package com.pqc.core.dto;
import com.pqc.core.entity.PlumberKycStatus; import java.time.LocalDateTime;
public record PlumberKycSummaryResponse(Long kycId,Long plumberId,String plumberName,String phone,Integer experienceYears,String serviceAreas,LocalDateTime submittedAt,PlumberKycStatus status) {}
