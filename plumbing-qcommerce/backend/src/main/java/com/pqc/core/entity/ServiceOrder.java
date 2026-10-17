package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plumber_id")
    private User plumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_id")
    private Store store;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType requestType;

    @Column(nullable = false)
    private String description;

    @Column(name = "issue_category")
    private String issueCategory;

    private String urgency;

    @Column(name = "scheduled_for")
    private LocalDateTime scheduledFor;

    @Column(name = "address_line_1")
    private String addressLine1;
    @Column(name = "address_line_2")
    private String addressLine2;
    private String landmark;
    private String city;
    @Column(name = "postal_code")
    private String postalCode;
    @Column(name = "customer_phone_snapshot")
    private String customerPhoneSnapshot;

    private Double customerLatitude;
    private Double customerLongitude;

    @Column(name = "visit_fee", precision = 19, scale = 2)
    private BigDecimal visitFee;
    @Column(length = 3)
    private String currency;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private User cancelledBy;
    @Column(name = "cancellation_reason")
    private String cancellationReason;

    // Billing fields — computed when job is COMPLETED
    private BigDecimal laborCharge;
    private BigDecimal partsCharge;
    private BigDecimal platformFee;
    private BigDecimal totalAmount;

    // Plumber referral commission on parts ordered mid-job (10% of partsCharge)
    @Column(name = "referral_commission")
    private BigDecimal referralCommission;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "customer_confirmed_at")
    private LocalDateTime customerConfirmedAt;

    @Column(name = "rated_at")
    private LocalDateTime ratedAt;

    private Integer rating;
    private String comment;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = OrderStatus.PENDING;
    }
}
