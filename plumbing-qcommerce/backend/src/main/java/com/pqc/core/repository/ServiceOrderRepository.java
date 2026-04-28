package com.pqc.core.repository;

import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {
    List<ServiceOrder> findByCustomer_Id(Long customerId);
    List<ServiceOrder> findByPlumber_Id(Long plumberId);
    List<ServiceOrder> findByStore_Id(Long storeId);
    List<ServiceOrder> findByStatus(OrderStatus status);

    @Query("SELECT SUM(o.totalAmount) FROM ServiceOrder o WHERE o.status = 'COMPLETED'")
    BigDecimal sumCompletedOrdersRevenue();

    long countByStatus(OrderStatus status);
}
