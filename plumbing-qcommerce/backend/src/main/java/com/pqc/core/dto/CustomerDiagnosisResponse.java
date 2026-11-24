package com.pqc.core.dto;
import com.pqc.core.entity.ServiceDiagnosis;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public record CustomerDiagnosisResponse(Long id, String state, String affectedComponent, String observedCondition, String diagnosisNarrative, String recommendedRemedy, BigDecimal estimatedLaborUnits, String knownMaterialCandidates, String safetyNotes, LocalDateTime submittedAt, List<DiagnosisEvidenceResponse> evidence) {
    public static CustomerDiagnosisResponse from(ServiceDiagnosis d, List<DiagnosisEvidenceResponse> e) { return new CustomerDiagnosisResponse(d.getId(), d.getState().name(), d.getAffectedComponent(), d.getObservedCondition(), d.getDiagnosisNarrative(), d.getRecommendedRemedy(), d.getEstimatedLaborUnits(), d.getKnownMaterialCandidates(), d.getSafetyNotes(), d.getSubmittedAt(), e); }
}
