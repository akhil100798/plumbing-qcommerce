package com.pqc.core.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "label is required")
    @Size(max = 255, message = "label is too long")
    @Column(nullable = false)
    private String label; // e.g. Home, Office, Other

    @NotBlank(message = "name is required")
    @Size(max = 255, message = "name is too long")
    @Column(nullable = false)
    private String name; // Receiver name

    @NotBlank(message = "addressLine is required")
    @Size(max = 255, message = "addressLine is too long")
    @Pattern(regexp = "(?s)^.*\\s-\\s[0-9]{6}\\s*$", message = "addressLine must end with a 6-digit Indian postal code")
    @Column(name = "address_line", nullable = false)
    private String addressLine; // Full street address

    @NotBlank(message = "phone is required")
    @Size(max = 255, message = "phone is too long")
    @Column(nullable = false)
    private String phone; // Contact number

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;
}
