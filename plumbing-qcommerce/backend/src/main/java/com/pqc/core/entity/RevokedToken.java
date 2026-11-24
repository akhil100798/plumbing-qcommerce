package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "revoked_tokens", indexes = {
        @Index(name = "idx_revoked_tokens_expires_at", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevokedToken {

    @Id
    @Column(nullable = false, length = 64)
    private String jti;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at", nullable = false)
    @Builder.Default
    private LocalDateTime revokedAt = LocalDateTime.now();

    @Column(length = 255)
    private String reason;
}
