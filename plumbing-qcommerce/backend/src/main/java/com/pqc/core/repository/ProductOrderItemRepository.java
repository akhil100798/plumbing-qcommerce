package com.pqc.core.repository;

import com.pqc.core.entity.ProductOrderItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;

public interface ProductOrderItemRepository extends JpaRepository<ProductOrderItem, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from ProductOrderItem i where i.id = :id")
    Optional<ProductOrderItem> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from ProductOrderItem i where i.order.id = :orderId order by i.id asc")
    List<ProductOrderItem> findByOrderIdForUpdate(@Param("orderId") Long orderId);

    @Query("select i from ProductOrderItem i join fetch i.order o join fetch i.product where i.id = :id")
    Optional<ProductOrderItem> findWithOrderAndProductById(@Param("id") Long id);

    @Modifying
    @Query(value = "UPDATE product_order_items SET unit=:unit WHERE id=:id AND unit='UNIT'", nativeQuery = true)
    int initializeUnitIfDefault(@Param("id") Long id, @Param("unit") String unit);
}
