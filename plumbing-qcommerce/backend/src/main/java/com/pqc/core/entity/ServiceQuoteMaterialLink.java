package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import jakarta.persistence.Transient;

@Entity
@Table(name = "service_quote_material_links")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceQuoteMaterialLink {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "service_order_id", nullable = false) private Long serviceOrderId;
    @Column(name = "quote_id", nullable = false) private Long quoteId;
    @Column(name = "material_request_id", nullable = false) private Long materialRequestId;
    @Column(name = "material_item_id") private Long materialItemId;
    @Column(name = "link_type", nullable = false, length = 32) private String linkType;
    @Enumerated(EnumType.STRING) @Column(name = "state", nullable = false, length = 32) private MaterialAuthorizationState authorizationState;
    @Transient private String itemUnit;
    @Transient private java.math.BigDecimal itemPrice;
    @Transient private java.math.BigDecimal itemAuthorizedQuantity;
    @Transient private String productName;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void created() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
