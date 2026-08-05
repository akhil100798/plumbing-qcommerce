package com.pqc.core.repository;

import com.pqc.core.entity.ServiceOrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceOrderStatusHistoryRepository extends JpaRepository<ServiceOrderStatusHistory, Long> {
    List<ServiceOrderStatusHistory> findByServiceOrderIdOrderByCreatedAtAsc(Long serviceOrderId);
}
