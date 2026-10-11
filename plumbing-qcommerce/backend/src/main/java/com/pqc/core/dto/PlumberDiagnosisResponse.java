package com.pqc.core.dto;
import com.pqc.core.entity.ServiceDiagnosis;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public record PlumberDiagnosisResponse(Long id, Long orderId, String state, Integer revisionNumber, String affectedComponent, String observedCondition, String diagnosisNarrative, String recommendedRemedy, BigDecimal estimatedLaborUnits, String knownMaterialCandidates, String safetyNotes, boolean safetyBlocked, LocalDateTime submittedAt, LocalDateTime createdAt, LocalDateTime updatedAt, Long version, List<DiagnosisEvidenceResponse> evidence) {
    public static PlumberDiagnosisResponse from(ServiceDiagnosis d, List<DiagnosisEvidenceResponse> evidence) { return new PlumberDiagnosisResponse(d.getId(), d.getServiceOrder().getId(), d.getState().name(), d.getVersionNumber(), d.getAffectedComponent(), d.getObservedCondition(), d.getDiagnosisNarrative(), d.getRecommendedRemedy(), d.getEstimatedLaborUnits(), d.getKnownMaterialCandidates(), d.getSafetyNotes(), d.isSafetyBlocked(), d.getSubmittedAt(), d.getCreatedAt(), d.getUpdatedAt(), d.getOptimisticVersion(), evidence); }
}
