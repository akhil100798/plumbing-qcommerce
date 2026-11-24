package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "phase2_idempotency_keys", uniqueConstraints = @UniqueConstraint(name = "uq_phase2_idempotency", columnNames = {"actor_id","operation","resource_type","resource_id","idempotency_key"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Phase2IdempotencyKey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "actor_id", nullable = false) private Long actorId;
    @Column(nullable = false, length = 80) private String operation;
    @Column(name = "resource_type", nullable = false, length = 80) private String resourceType;
    @Column(name = "resource_id", nullable = false) private Long resourceId;
    @Column(name = "idempotency_key", nullable = false, length = 160) private String idempotencyKey;
    @Column(name = "request_fingerprint", nullable = false, length = 128) private String requestFingerprint;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24) private Phase2IdempotencyStatus status;
    @Column(name = "response_payload", columnDefinition = "TEXT") private String responsePayload;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = LocalDateTime.now(); }
}
