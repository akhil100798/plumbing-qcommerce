package com.pqc.core.repository;

import com.pqc.core.entity.BeneficiaryType;
import com.pqc.core.entity.Settlement;
import com.pqc.core.entity.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long>, JpaSpecificationExecutor<Settlement> {
    long countByBeneficiaryType(BeneficiaryType beneficiaryType);
    long countByBeneficiaryTypeAndStatus(BeneficiaryType beneficiaryType, SettlementStatus status);
    long countByStatus(SettlementStatus status);
    List<Settlement> findByBeneficiaryType(BeneficiaryType beneficiaryType);
}