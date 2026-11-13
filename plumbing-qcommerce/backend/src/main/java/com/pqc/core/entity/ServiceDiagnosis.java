package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_diagnoses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceDiagnosis {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "service_order_id") private ServiceOrder serviceOrder;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "plumber_id") private User plumber;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "revision_of_diagnosis_id") private ServiceDiagnosis revisionOfDiagnosis;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private DiagnosisState state;
    @Column(name = "version_number", nullable = false) private Integer versionNumber;
    /** Legacy V26 version column retained for the original uniqueness contract. */
    @Column(name = "version", nullable = false) private Integer legacyVersion;
    @Column(nullable = false, length = 4000) private String summary;
    @Column(name = "affected_component", length = 500) private String affectedComponent;
    @Column(name = "observed_condition", length = 4000) private String observedCondition;
    @Column(name = "diagnosis_narrative", length = 8000) private String diagnosisNarrative;
    @Column(name = "recommended_remedy", length = 4000) private String recommendedRemedy;
    @Column(name = "estimated_labor_units", precision = 12, scale = 2) private BigDecimal estimatedLaborUnits;
    @Column(name = "known_material_candidates", length = 4000) private String knownMaterialCandidates;
    @Column(name = "safety_notes", length = 4000) private String safetyNotes;
    @Column(name = "safety_blocked", nullable = false) private boolean safetyBlocked;
    @Column(name = "submitted_at") private LocalDateTime submittedAt;
    @Column(name = "cancelled_at") private LocalDateTime cancelledAt;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @Version @Column(name = "optimistic_version", nullable = false) private Long optimisticVersion;
    @PrePersist void createTimestamps() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        // V26's legacy version column remains NOT NULL and unique per order.
        // Phase 2 uses version_number as its public revision field, so mirror
        // it on insert to preserve the original database contract.
        if (legacyVersion == null) legacyVersion = versionNumber;
    }
    @PreUpdate void updateTimestamp() { updatedAt = LocalDateTime.now(); }
}
