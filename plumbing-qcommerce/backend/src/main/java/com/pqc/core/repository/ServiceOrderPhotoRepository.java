package com.pqc.core.repository;

import com.pqc.core.entity.ServiceOrderPhoto;
import com.pqc.core.entity.ServiceOrderPhotoPhase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceOrderPhotoRepository extends JpaRepository<ServiceOrderPhoto, Long> {
    List<ServiceOrderPhoto> findByServiceOrder_IdAndPhaseOrderByCreatedAtAsc(Long serviceOrderId, ServiceOrderPhotoPhase phase);
}
