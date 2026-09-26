package com.pqc.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "service_order_plumber_dispositions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_service_order_plumber_disposition",
                columnNames = {"service_order_id", "plumber_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderPlumberDisposition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_order_id", nullable = false)
    private Long serviceOrderId;

    @Column(name = "plumber_id", nullable = false)
    private Long plumberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PlumberJobDisposition disposition;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
