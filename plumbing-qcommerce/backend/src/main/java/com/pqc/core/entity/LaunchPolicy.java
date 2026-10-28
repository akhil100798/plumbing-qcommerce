package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "launch_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaunchPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_key", nullable = false, unique = true, length = 80)
    private String policyKey;

    @Column(name = "owned_store_id")
    private Long ownedStoreId;

    @Column(name = "service_area_center_latitude")
    private Double serviceAreaCenterLatitude;

    @Column(name = "service_area_center_longitude")
    private Double serviceAreaCenterLongitude;

    @Column(name = "service_area_radius_km", precision = 10, scale = 3)
    private BigDecimal serviceAreaRadiusKm;

    @Column(name = "visit_fee", precision = 19, scale = 2)
    private BigDecimal visitFee;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "payout_policy_version", length = 80)
    private String payoutPolicyVersion;

    @Column(name = "cancellation_policy_version", length = 80)
    private String cancellationPolicyVersion;

    @Column(name = "refund_policy_version", length = 80)
    private String refundPolicyVersion;

    @Column(name = "service_material_enforcement_enabled", nullable = false)
    private boolean serviceMaterialEnforcementEnabled;

    @Column(name = "roster_enforcement_enabled", nullable = false)
    private boolean rosterEnforcementEnabled;

    @Column(name = "active", nullable = false)
    private boolean active;
}
