package com.pqc.core.repository;

import com.pqc.core.entity.ServiceOrderAssignment;
import com.pqc.core.entity.ServiceOrderAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ServiceOrderAssignmentRepository extends JpaRepository<ServiceOrderAssignment, Long> {
    List<ServiceOrderAssignment> findByServiceOrderIdOrderByCreatedAtAsc(Long serviceOrderId);

    Optional<ServiceOrderAssignment> findFirstByServiceOrderIdAndStatusInOrderByCreatedAtDesc(
            Long serviceOrderId, Collection<ServiceOrderAssignmentStatus> statuses);

    boolean existsByServiceOrderIdAndStatusIn(Long serviceOrderId, Collection<ServiceOrderAssignmentStatus> statuses);

    List<ServiceOrderAssignment> findByServiceOrderIdAndStatusIn(Long serviceOrderId, Collection<ServiceOrderAssignmentStatus> statuses);

    @Query("select a from ServiceOrderAssignment a where a.serviceOrderId = :orderId and a.status in :statuses order by a.createdAt desc")
    List<ServiceOrderAssignment> findActiveForOrder(Long orderId, Collection<ServiceOrderAssignmentStatus> statuses);
}
