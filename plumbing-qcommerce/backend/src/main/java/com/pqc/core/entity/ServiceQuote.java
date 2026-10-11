package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "service_quotes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceQuote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "service_order_id") private ServiceOrder serviceOrder;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "diagnosis_id") private ServiceDiagnosis diagnosis;
    @Enumerated(EnumType.STRING) @Column(name = "quote_kind", nullable = false, length = 32) private QuoteKind quoteKind;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private QuoteState state;
    @Column(nullable = false) private Integer version;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(name = "labor_subtotal", nullable = false, precision = 19, scale = 2) private BigDecimal laborSubtotal;
    @Column(name = "known_material_subtotal", nullable = false, precision = 19, scale = 2) private BigDecimal knownMaterialSubtotal;
    @Column(length = 3) private String currency;
    @Column(name = "pricing_catalog_id") private Long pricingCatalogId;
    @Column(name = "pricing_catalog_version") private Integer pricingCatalogVersion;
    @Column(name = "published_at") private LocalDateTime publishedAt;
    @Column(name = "expires_at") private LocalDateTime expiresAt;
    @Column(name = "approved_at") private LocalDateTime approvedAt;
    @Column(name = "rejected_at") private LocalDateTime rejectedAt;
    @Column(name = "decision_actor_id") private Long decisionActorId;
    @Column(name = "decision_reason", length = 1000) private String decisionReason;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "supersedes_quote_id", insertable = false, updatable = false) private ServiceQuote supersedesQuote;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "base_quote_id") private ServiceQuote baseQuote;
    @Column(name = "material_request_id") private Long materialRequestId;
    @Column(name = "supersedes_quote_id") private Long supersedesQuoteId;
    @Column(name = "immutable_snapshot_at") private LocalDateTime immutableSnapshotAt;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Version @Column(name = "optimistic_version", nullable = false) private Long optimisticVersion;
    @PrePersist void created() { createdAt = LocalDateTime.now(); if (laborSubtotal == null) laborSubtotal = BigDecimal.ZERO; if (knownMaterialSubtotal == null) knownMaterialSubtotal = BigDecimal.ZERO; }
}
