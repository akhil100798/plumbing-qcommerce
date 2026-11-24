package com.pqc.core.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private ProductOrder order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private Integer reservedQuantity = 0;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String unit = "UNIT";

    @Column(name = "unit_price_snapshot", precision = 19, scale = 2)
    private BigDecimal unitPriceSnapshot;

    @Column(name = "pricing_source", length = 32)
    private String pricingSource;

    @Column(name = "pricing_catalog_line_id")
    private Long pricingCatalogLineId;

    @Column(name = "pricing_catalog_version")
    private Integer pricingCatalogVersion;

    @Column(name = "packed_quantity", nullable = false)
    @Builder.Default
    private Integer packedQuantity = 0;

    @Column(nullable = false)
    private BigDecimal price; // price at the time of purchase
}
