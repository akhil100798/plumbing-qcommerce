package com.pqc.core.repository;

import com.pqc.core.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByStoreIdAndProductId(Long storeId, Long productId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Stock> findForUpdateByStoreIdAndProductId(Long storeId, Long productId);
    List<Stock> findByStoreId(Long storeId);
}
