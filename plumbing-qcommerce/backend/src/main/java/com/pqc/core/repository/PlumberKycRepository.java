package com.pqc.core.repository;
import com.pqc.core.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PlumberKycRepository extends JpaRepository<PlumberKyc,Long> {
    Optional<PlumberKyc> findByPlumberId(Long plumberId);
    List<PlumberKyc> findByStatusOrderBySubmittedAtAsc(PlumberKycStatus status);
    long countByStatus(PlumberKycStatus status);
    long countByAvailabilityStatus(PlumberAvailabilityStatus status);
}
