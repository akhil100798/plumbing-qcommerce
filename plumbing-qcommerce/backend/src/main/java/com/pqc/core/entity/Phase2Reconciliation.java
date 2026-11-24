package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "phase2_reconciliations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Phase2Reconciliation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_order_id", nullable = false)
    private Long serviceOrderId;

    @Column(name = "authorization_snapshot_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal authorizedRepairAmount;

    @Column(name = "legacy_repair_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal legacyRepairAmount;

    @Column(name = "variance_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal varianceAmount;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private ReconciliationState status;

    @Column(name = "correction_type", length = 32)
    private String correctionType;

    @Column(name = "correction_quote_id")
    private Long correctionQuoteId;

    @Column(name = "correction_addendum_id")
    private Long correctionAddendumId;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(length = 1000)
    private String resolution;

    @PrePersist void created() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
