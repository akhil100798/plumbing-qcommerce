package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "service_diagnosis_evidence", uniqueConstraints = @UniqueConstraint(name = "uq_diagnosis_evidence_photo", columnNames = {"diagnosis_id", "photo_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceDiagnosisEvidence {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "diagnosis_id") private ServiceDiagnosis diagnosis;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "photo_id") private ServiceOrderPhoto photo;
    @Column(name = "evidence_role", nullable = false, length = 32) private String evidenceRole;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
