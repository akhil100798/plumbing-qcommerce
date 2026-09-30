package com.pqc.core.repository;

import com.pqc.core.entity.LaunchPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface LaunchPolicyRepository extends JpaRepository<LaunchPolicy, Long> {
    Optional<LaunchPolicy> findFirstByPolicyKeyAndActiveTrue(String policyKey);
    List<LaunchPolicy> findAllByPolicyKeyAndActiveTrue(String policyKey);
}
