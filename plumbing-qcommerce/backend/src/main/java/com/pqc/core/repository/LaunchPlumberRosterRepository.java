package com.pqc.core.repository;

import com.pqc.core.entity.LaunchPlumberRoster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LaunchPlumberRosterRepository extends JpaRepository<LaunchPlumberRoster, Long> {
    boolean existsByPolicyIdAndPlumberIdAndApprovedTrue(Long policyId, Long plumberId);
    java.util.Optional<LaunchPlumberRoster> findByPolicy_IdAndPlumberId(Long policyId, Long plumberId);
    java.util.List<LaunchPlumberRoster> findAllByPolicy_IdOrderByIdAsc(Long policyId);
}
