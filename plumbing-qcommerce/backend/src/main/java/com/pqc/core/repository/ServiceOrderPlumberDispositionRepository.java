package com.pqc.core.repository;

import com.pqc.core.entity.PlumberJobDisposition;
import com.pqc.core.entity.ServiceOrderPlumberDisposition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceOrderPlumberDispositionRepository extends JpaRepository<ServiceOrderPlumberDisposition, Long> {
    Optional<ServiceOrderPlumberDisposition> findByServiceOrderIdAndPlumberId(Long serviceOrderId, Long plumberId);

    boolean existsByServiceOrderIdAndPlumberIdAndDisposition(
            Long serviceOrderId, Long plumberId, PlumberJobDisposition disposition);
}
