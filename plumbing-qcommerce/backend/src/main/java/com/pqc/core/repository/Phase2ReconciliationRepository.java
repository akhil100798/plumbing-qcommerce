package com.pqc.core.repository;

import com.pqc.core.entity.Phase2Reconciliation;
import com.pqc.core.entity.ReconciliationState;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface Phase2ReconciliationRepository extends JpaRepository<Phase2Reconciliation, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Phase2Reconciliation r where r.serviceOrderId = :orderId and r.status in :states order by r.createdAt, r.id")
    List<Phase2Reconciliation> findOpenForUpdate(@Param("orderId") Long orderId,
                                                 @Param("states") Set<ReconciliationState> states);

    List<Phase2Reconciliation> findByServiceOrderIdOrderByCreatedAtDesc(Long serviceOrderId);
}
