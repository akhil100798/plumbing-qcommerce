package com.pqc.core.dto;
import com.pqc.core.entity.PlumberKycStatus; import java.time.LocalDateTime;
public record PlumberKycDetailResponse(Long kycId,Long plumberId,String plumberName,String phone,String email,String aadhaarNumberMasked,String panNumberMasked,String bankAccountMasked,Integer experienceYears,String serviceAreas,String documentStatus,PlumberKycStatus status,LocalDateTime submittedAt,LocalDateTime reviewedAt,Long reviewedByAdminId,String rejectionReason) {}
