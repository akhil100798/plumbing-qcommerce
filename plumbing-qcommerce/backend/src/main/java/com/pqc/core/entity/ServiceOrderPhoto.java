package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "service_order_photos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceOrderPhoto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_order_id", nullable = false)
    private ServiceOrder serviceOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ServiceOrderPhotoPhase phase;

    @Column(nullable = false, length = 255)
    private String storageKey;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void beforeInsert() { createdAt = LocalDateTime.now(); }
}
