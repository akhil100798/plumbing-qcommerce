package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "launch_plumber_roster",
        uniqueConstraints = @UniqueConstraint(name = "uq_launch_roster_policy_plumber", columnNames = {"policy_id", "plumber_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaunchPlumberRoster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id", nullable = false)
    private LaunchPolicy policy;

    @Column(name = "plumber_id", nullable = false)
    private Long plumberId;

    @Column(name = "approved", nullable = false)
    private boolean approved;
}
