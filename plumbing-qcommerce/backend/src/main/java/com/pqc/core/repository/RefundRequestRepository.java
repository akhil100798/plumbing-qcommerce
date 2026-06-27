package com.pqc.core.repository;

import com.pqc.core.entity.RefundRequest;
import com.pqc.core.entity.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long>, JpaSpecificationExecutor<RefundRequest> {
    long countByStatus(RefundStatus status);
}