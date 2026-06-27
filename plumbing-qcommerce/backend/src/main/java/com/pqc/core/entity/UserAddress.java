package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String label; // e.g. Home, Office, Other

    @Column(nullable = false)
    private String name; // Receiver name

    @Column(name = "address_line", nullable = false)
    private String addressLine; // Full street address

    @Column(nullable = false)
    private String phone; // Contact number

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;
}
