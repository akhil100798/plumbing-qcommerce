package com.pqc.core.repository;

import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long>, JpaSpecificationExecutor<ServiceOrder> {
    List<ServiceOrder> findByCustomer_Id(Long customerId);
    List<ServiceOrder> findByPlumber_Id(Long plumberId);
    List<ServiceOrder> findByStore_Id(Long storeId);
    List<ServiceOrder> findByStatus(OrderStatus status);
    long countByCustomer_Id(Long customerId);
    long countByPlumber_Id(Long plumberId);
    long countByStatusIn(Collection<OrderStatus> statuses);
    long countByStatusAndCreatedAtBetween(OrderStatus status, LocalDateTime start, LocalDateTime end);
    boolean existsByCustomer_IdAndPlumber_IdAndStatusIn(Long customerId, Long plumberId, List<OrderStatus> statuses);

    @Query("SELECT SUM(o.totalAmount) FROM ServiceOrder o WHERE o.status = 'COMPLETED'")
    BigDecimal sumCompletedOrdersRevenue();

    long countByStatus(OrderStatus status);

    @Query("SELECT AVG(s.rating) FROM ServiceOrder s WHERE s.plumber.id = :plumberId AND s.rating IS NOT NULL")
    Double findAverageRatingForPlumber(@org.springframework.data.repository.query.Param("plumberId") Long plumberId);

    @Query("SELECT COUNT(DISTINCT o.plumber.id) FROM ServiceOrder o WHERE o.status IN :statuses AND o.plumber IS NOT NULL")
    long countDistinctActivePlumbers(@org.springframework.data.repository.query.Param("statuses") List<OrderStatus> statuses);
}
