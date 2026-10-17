package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "phase2_enrollments", uniqueConstraints = @UniqueConstraint(name = "uq_phase2_enrollment_order", columnNames = "service_order_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Phase2Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "service_order_id", nullable = false) private Long serviceOrderId;
    @Column(name = "enabled_snapshot", nullable = false) private boolean enabledSnapshot;
    @Column(name = "policy_snapshot", length = 1000) private String policySnapshot;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
