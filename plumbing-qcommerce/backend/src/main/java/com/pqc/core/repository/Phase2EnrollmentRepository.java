package com.pqc.core.repository;

import com.pqc.core.entity.Phase2Enrollment;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface Phase2EnrollmentRepository extends JpaRepository<Phase2Enrollment, Long> {
    Optional<Phase2Enrollment> findByServiceOrderId(Long serviceOrderId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Phase2Enrollment e where e.serviceOrderId = :serviceOrderId")
    Optional<Phase2Enrollment> findByServiceOrderIdForUpdate(@Param("serviceOrderId") Long serviceOrderId);
}
