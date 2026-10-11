package com.pqc.core.dto;
import com.pqc.core.entity.ServiceDiagnosisEvidence;
import java.time.LocalDateTime;
public record DiagnosisEvidenceResponse(Long id, Long photoId, String phase, String contentType, long sizeBytes, LocalDateTime createdAt) {
    public static DiagnosisEvidenceResponse from(ServiceDiagnosisEvidence e) { var p=e.getPhoto(); return new DiagnosisEvidenceResponse(e.getId(), p.getId(), p.getPhase().name(), p.getContentType(), p.getSizeBytes(), e.getCreatedAt()); }
}
