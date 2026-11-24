package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "service_pricing_catalog")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServicePricingCatalog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "catalog_key", nullable = false, length = 160) private String catalogKey;
    @Column(nullable = false, length = 3) private String currency;
    @Column(nullable = false) private Integer version;
    @Column(nullable = false, length = 32) private String status;
    @Column(name = "effective_from", nullable = false) private LocalDateTime effectiveFrom;
    @Column(name = "effective_to") private LocalDateTime effectiveTo;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
