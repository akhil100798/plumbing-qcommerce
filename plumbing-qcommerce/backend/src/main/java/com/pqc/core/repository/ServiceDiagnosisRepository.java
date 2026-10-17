package com.pqc.core.repository;

import com.pqc.core.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;

public interface ServiceDiagnosisRepository extends JpaRepository<ServiceDiagnosis, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from ServiceDiagnosis d where d.id = :id") Optional<ServiceDiagnosis> findByIdForUpdate(@Param("id") Long id);
    @Query("select d from ServiceDiagnosis d where d.serviceOrder.id = :orderId order by d.versionNumber desc") List<ServiceDiagnosis> findByServiceOrderId(@Param("orderId") Long orderId);
    @Query("select d from ServiceDiagnosis d where d.serviceOrder.id = :orderId and d.state in :states order by d.versionNumber desc") List<ServiceDiagnosis> findCurrent(@Param("orderId") Long orderId, @Param("states") Set<DiagnosisState> states);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from ServiceDiagnosis d where d.serviceOrder.id = :orderId order by d.id")
    List<ServiceDiagnosis> findByServiceOrderIdForUpdate(@Param("orderId") Long orderId);
    @Query("select d from ServiceDiagnosis d where d.revisionOfDiagnosis.id = :id") Optional<ServiceDiagnosis> findRevisionOf(@Param("id") Long id);
    @Query("select d from ServiceDiagnosis d where d.serviceOrder.id = :orderId order by d.versionNumber desc") List<ServiceDiagnosis> findHistory(@Param("orderId") Long orderId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from ServiceDiagnosis d where d.serviceOrder.id = :orderId and d.state in :states order by d.id") List<ServiceDiagnosis> findOpenForUpdate(@Param("orderId") Long orderId, @Param("states") Set<DiagnosisState> states);
}
