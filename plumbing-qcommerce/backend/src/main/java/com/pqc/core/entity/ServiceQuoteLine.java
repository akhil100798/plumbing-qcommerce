package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "service_quote_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceQuoteLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "quote_id") private ServiceQuote quote;
    @Column(name = "material_item_id") private Long materialItemId;
    @Column(name = "material_request_id") private Long materialRequestId;
    @Column(name = "material_link_id") private Long materialLinkId;
    @Column(name = "line_type", nullable = false) private String lineType;
    @Column(nullable = false, length = 1000) private String description;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(name = "pricing_source", nullable = false) private String pricingSource;
    @Column(name = "pricing_catalog_line_id") private Long pricingCatalogLineId;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal quantity;
    @Column(nullable = false, length = 32) private String unit;
    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2) private BigDecimal unitPrice;
    @Column(name = "line_total", nullable = false, precision = 19, scale = 2) private BigDecimal lineTotal;
    @Column(name = "pricing_source_version") private Integer pricingSourceVersion;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
