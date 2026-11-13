package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "service_quote_events", uniqueConstraints = @UniqueConstraint(name = "uq_quote_event_transition", columnNames = {"aggregate_type","aggregate_id","transition_key","event_type"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceQuoteEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "service_order_id", nullable = false) private Long serviceOrderId;
    @Column(name = "diagnosis_id") private Long diagnosisId;
    @Column(name = "quote_id") private Long quoteId;
    @Column(name = "aggregate_type", nullable = false, length = 32) private String aggregateType;
    @Column(name = "aggregate_id", nullable = false) private Long aggregateId;
    @Column(name = "transition_key", nullable = false, length = 64) private String transitionKey;
    @Column(name = "event_type", nullable = false, length = 48) private String eventType;
    @Column(name = "from_state", length = 32) private String fromState;
    @Column(name = "to_state", length = 32) private String toState;
    @Column(name = "actor_id") private Long actorId;
    @Column(name = "actor_role", length = 48) private String actorRole;
    @Column(length = 1000) private String reason;
    @Column(name = "idempotency_key_id") private Long idempotencyKeyId;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
