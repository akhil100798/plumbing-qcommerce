package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "launch_roster_audit_history")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaunchRosterAuditHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "plumber_id", nullable = false)
    private Long plumberId;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LaunchRosterAuditAction action;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
