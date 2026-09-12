package com.pqc.core.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "store_business_hours", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"store_id", "day_of_week"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreBusinessHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Store store;

    @Column(name = "day_of_week", nullable = false)
    private String dayOfWeek; // MONDAY, TUESDAY, etc.

    @Column(name = "open_time")
    @JsonFormat(pattern = "HH:mm")
    @Builder.Default
    private LocalTime openTime = LocalTime.of(8, 0);

    @Column(name = "close_time")
    @JsonFormat(pattern = "HH:mm")
    @Builder.Default
    private LocalTime closeTime = LocalTime.of(20, 0);

    @Column(nullable = false)
    @Builder.Default
    private Boolean closed = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
