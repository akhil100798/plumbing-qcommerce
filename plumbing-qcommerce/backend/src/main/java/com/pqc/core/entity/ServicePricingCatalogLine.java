package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "service_pricing_catalog_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServicePricingCatalogLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "pricing_catalog_id", nullable = false) private Long pricingCatalogId;
    @Column(name = "line_key", nullable = false, length = 160) private String lineKey;
    @Column(name = "line_type", nullable = false, length = 32) private String lineType;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(length = 32) private String unit;
    @Column(name = "min_quantity", nullable = false, precision = 10, scale = 2) private BigDecimal minQuantity;
    @Column(name = "max_quantity", precision = 10, scale = 2) private BigDecimal maxQuantity;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); if (minQuantity == null) minQuantity = BigDecimal.ONE; }
}
