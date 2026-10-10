package com.pqc.core.repository;

import com.pqc.core.entity.LaunchPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.List;

public interface LaunchPolicyRepository extends JpaRepository<LaunchPolicy, Long> {
    Optional<LaunchPolicy> findFirstByPolicyKeyAndActiveTrue(String policyKey);
    List<LaunchPolicy> findAllByPolicyKeyAndActiveTrue(String policyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select policy from LaunchPolicy policy where policy.id = :id")
    Optional<LaunchPolicy> findByIdForUpdate(@Param("id") Long id);

    List<LaunchPolicy> findAllByPolicyKeyOrderByIdAsc(String policyKey);
}
