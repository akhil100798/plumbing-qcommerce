package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "stores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Store name is required")
    private String name;

    @Column(nullable = false)
    @NotBlank(message = "Store address is required")
    private String address;

    @Column(nullable = false)
    @NotNull(message = "Store latitude is required")
    private Double latitude;

    @Column(nullable = false)
    @NotNull(message = "Store longitude is required")
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;
}
