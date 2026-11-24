package com.pqc.core.repository;

import com.pqc.core.entity.ServiceDiagnosisEvidence;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface ServiceDiagnosisEvidenceRepository extends JpaRepository<ServiceDiagnosisEvidence, Long> {
    List<ServiceDiagnosisEvidence> findByDiagnosisIdOrderByCreatedAtAsc(Long diagnosisId);
    boolean existsByDiagnosisIdAndPhotoId(Long diagnosisId, Long photoId);
    @Query("select e from ServiceDiagnosisEvidence e join fetch e.photo where e.diagnosis.id = :diagnosisId order by e.createdAt asc") List<ServiceDiagnosisEvidence> findWithPhoto(@Param("diagnosisId") Long diagnosisId);
}
