package com.pqc.core.repository;

import com.pqc.core.entity.InventoryReservation;
import com.pqc.core.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {
    List<InventoryReservation> findByStatusAndExpiresAtBefore(ReservationStatus status, LocalDateTime time);
    List<InventoryReservation> findByCustomerId(Long customerId);
    List<InventoryReservation> findByOrderId(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from InventoryReservation r where r.order.id = :orderId order by r.id asc")
    List<InventoryReservation> findByOrderIdForUpdate(@Param("orderId") Long orderId);
}
