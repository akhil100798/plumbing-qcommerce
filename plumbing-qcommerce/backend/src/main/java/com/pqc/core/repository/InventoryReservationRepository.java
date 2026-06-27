package com.pqc.core.repository;

import com.pqc.core.entity.InventoryReservation;
import com.pqc.core.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {
    List<InventoryReservation> findByStatusAndExpiresAtBefore(ReservationStatus status, LocalDateTime time);
    List<InventoryReservation> findByCustomerId(Long customerId);
    List<InventoryReservation> findByOrderId(Long orderId);
}
