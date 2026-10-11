package com.pqc.core.dto;

import com.pqc.core.entity.ServiceDiagnosis;
import java.time.LocalDateTime;
import java.util.List;

public record AdminDiagnosisResponse(
        Long id, Long orderId, Long plumberId, String state, Integer versionNumber,
        Long revisionOfDiagnosisId, String affectedComponent, String observedCondition,
        String diagnosisNarrative, String recommendedRemedy, java.math.BigDecimal estimatedLaborUnits,
        String knownMaterialCandidates, String safetyNotes, boolean safetyBlocked,
        LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime submittedAt,
        LocalDateTime cancelledAt, List<DiagnosisEvidenceResponse> evidence) {
    public static AdminDiagnosisResponse from(ServiceDiagnosis d, List<DiagnosisEvidenceResponse> e) {
        return new AdminDiagnosisResponse(d.getId(), d.getServiceOrder().getId(), d.getPlumber().getId(),
                d.getState().name(), d.getVersionNumber(), d.getRevisionOfDiagnosis() == null ? null : d.getRevisionOfDiagnosis().getId(),
                d.getAffectedComponent(), d.getObservedCondition(), d.getDiagnosisNarrative(), d.getRecommendedRemedy(),
                d.getEstimatedLaborUnits(), d.getKnownMaterialCandidates(), d.getSafetyNotes(), d.isSafetyBlocked(),
                d.getCreatedAt(), d.getUpdatedAt(), d.getSubmittedAt(), d.getCancelledAt(), e);
    }
}
