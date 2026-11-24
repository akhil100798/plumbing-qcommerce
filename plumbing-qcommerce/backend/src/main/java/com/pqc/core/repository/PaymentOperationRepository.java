package com.pqc.core.repository;

import com.pqc.core.entity.PaymentOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface PaymentOperationRepository extends JpaRepository<PaymentOperation, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentOperation p where p.serviceOrderId = :orderId and p.purpose = :purpose")
    Optional<PaymentOperation> findForUpdate(@Param("orderId") Long orderId, @Param("purpose") String purpose);

    Optional<PaymentOperation> findByServiceOrderIdAndPurpose(Long serviceOrderId, String purpose);
}
