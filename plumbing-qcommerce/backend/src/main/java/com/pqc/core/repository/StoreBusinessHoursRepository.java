package com.pqc.core.repository;

import com.pqc.core.entity.StoreBusinessHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreBusinessHoursRepository extends JpaRepository<StoreBusinessHours, Long> {
    List<StoreBusinessHours> findByStoreId(Long storeId);
    Optional<StoreBusinessHours> findByStoreIdAndDayOfWeek(Long storeId, String dayOfWeek);
}
