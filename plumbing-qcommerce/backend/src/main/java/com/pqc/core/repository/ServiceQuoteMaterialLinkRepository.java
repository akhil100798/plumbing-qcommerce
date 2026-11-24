package com.pqc.core.repository;

import com.pqc.core.entity.MaterialAuthorizationState;
import com.pqc.core.entity.ServiceQuoteMaterialLink;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ServiceQuoteMaterialLinkRepository extends JpaRepository<ServiceQuoteMaterialLink, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from ServiceQuoteMaterialLink l where l.quoteId = :quoteId order by l.id")
    List<ServiceQuoteMaterialLink> findByQuoteIdForUpdate(@Param("quoteId") Long quoteId);

    List<ServiceQuoteMaterialLink> findByQuoteIdOrderByIdAsc(Long quoteId);
    List<ServiceQuoteMaterialLink> findByServiceOrderIdOrderByIdAsc(Long serviceOrderId);
    boolean existsByMaterialItemIdAndAuthorizationStateIn(Long materialItemId, List<MaterialAuthorizationState> states);
    Optional<ServiceQuoteMaterialLink> findFirstByQuoteIdAndMaterialItemId(Long quoteId, Long materialItemId);
    List<ServiceQuoteMaterialLink> findByMaterialRequestIdAndAuthorizationStateIn(Long requestId, List<MaterialAuthorizationState> states);
    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ServiceQuoteMaterialLink l where l.quoteId = :quoteId and l.authorizationState = :state")
    int deleteByQuoteIdAndState(@Param("quoteId") Long quoteId, @Param("state") MaterialAuthorizationState state);
    @org.springframework.data.jpa.repository.Modifying
    @Query("update ServiceQuoteMaterialLink l set l.authorizationState = :state where l.quoteId = :quoteId")
    int transitionByQuoteId(@Param("quoteId") Long quoteId, @Param("state") MaterialAuthorizationState state);
    @Query(value = "select l.id,l.service_order_id,l.quote_id,l.material_request_id,l.material_item_id,l.link_type,l.state,"
            + "i.unit,coalesce(i.unit_price_snapshot,i.price) as item_price,"
            + "coalesce(i.packed_quantity,0) as packed_quantity,p.name as product_name "
            + "from service_quote_material_links l left join product_order_items i on i.id=l.material_item_id "
            + "left join products p on p.id=i.product_id where l.quote_id=:quoteId order by l.id", nativeQuery = true)
    List<Object[]> findHistoryDetails(@Param("quoteId") Long quoteId);
    @Query("update ServiceQuoteMaterialLink l set l.authorizationState = :state where l.quoteId = :quoteId and l.authorizationState in :fromStates")
    @org.springframework.data.jpa.repository.Modifying
    int transitionByQuoteAndStates(@Param("quoteId") Long quoteId,
                                   @Param("fromStates") List<MaterialAuthorizationState> fromStates,
                                   @Param("state") MaterialAuthorizationState state);
}
