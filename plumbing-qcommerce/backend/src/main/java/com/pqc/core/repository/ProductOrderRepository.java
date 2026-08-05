package com.pqc.core.repository;

import com.pqc.core.entity.ProductOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pqc.core.entity.ProductOrderStatus;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Collection;

public interface ProductOrderRepository extends JpaRepository<ProductOrder, Long>, JpaSpecificationExecutor<ProductOrder> {
    List<ProductOrder> findByCustomerId(Long customerId);
    List<ProductOrder> findByCustomerIdAndServiceOrderIsNotNull(Long customerId);
    List<ProductOrder> findByStoreId(Long storeId);
    List<ProductOrder> findByStoreIdAndStatus(Long storeId, ProductOrderStatus status);
    List<ProductOrder> findByStore_Manager_IdAndServiceOrderIsNotNull(Long managerId);
    List<ProductOrder> findByDeliveryPartnerId(Long deliveryPartnerId);
    List<ProductOrder> findByStatus(ProductOrderStatus status);
    long countByStatus(ProductOrderStatus status);
    List<ProductOrder> findByServiceOrderId(Long serviceOrderId);
    List<ProductOrder> findByServiceOrderIdAndStatus(Long serviceOrderId, ProductOrderStatus status);
    List<ProductOrder> findByServiceOrder_Plumber_Id(Long plumberId);
    List<ProductOrder> findByServiceOrderIdAndServiceOrderCustomerId(Long serviceOrderId, Long customerId);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByCustomerId(Long customerId);
    long countByDeliveryPartnerId(Long deliveryPartnerId);
    long countByDeliveryPartnerIdAndStatusIn(Long deliveryPartnerId, Collection<ProductOrderStatus> statuses);
    long countByStatusIn(Collection<ProductOrderStatus> statuses);
    long countByStatusAndCreatedAtBetween(ProductOrderStatus status, LocalDateTime start, LocalDateTime end);
    long countByServiceOrderIsNotNullAndStatusIn(Collection<ProductOrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM ProductOrder o WHERE o.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") ProductOrderStatus status);
}

