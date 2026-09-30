package com.pqc.core.repository;

import com.pqc.core.entity.LaunchPlumberRoster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LaunchPlumberRosterRepository extends JpaRepository<LaunchPlumberRoster, Long> {
    boolean existsByPolicyIdAndPlumberIdAndApprovedTrue(Long policyId, Long plumberId);
}
