package com.pqc.core.repository;

import com.pqc.core.entity.ProductOrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductOrderStatusHistoryRepository extends JpaRepository<ProductOrderStatusHistory, Long> {
    List<ProductOrderStatusHistory> findByProductOrderIdOrderByCreatedAtAsc(Long productOrderId);
}
