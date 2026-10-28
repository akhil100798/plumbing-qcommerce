package com.pqc.core.repository;

import com.pqc.core.entity.ServiceQuote;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;

public interface ServiceQuoteRepository extends JpaRepository<ServiceQuote, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select q from ServiceQuote q where q.id = :id") Optional<ServiceQuote> findByIdForUpdate(@Param("id") Long id);
    boolean existsByServiceOrderIdAndQuoteKind(Long orderId, com.pqc.core.entity.QuoteKind kind);
    List<ServiceQuote> findByServiceOrderIdOrderByVersionAsc(Long orderId);
    List<ServiceQuote> findByServiceOrderIdOrderByVersionDesc(Long orderId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select q from ServiceQuote q where q.serviceOrder.id = :orderId order by q.id")
    List<ServiceQuote> findByServiceOrderIdForUpdate(@Param("orderId") Long orderId);
    Optional<ServiceQuote> findFirstByServiceOrderIdAndQuoteKindAndState(Long orderId, com.pqc.core.entity.QuoteKind kind, com.pqc.core.entity.QuoteState state);
    @Query("select q from ServiceQuote q where q.serviceOrder.id = :orderId and q.quoteKind = :kind order by q.version desc")
    List<ServiceQuote> findVersions(@Param("orderId") Long orderId, @Param("kind") com.pqc.core.entity.QuoteKind kind);
    List<ServiceQuote> findByServiceOrderIdAndBaseQuoteIdAndQuoteKindOrderByVersionDesc(Long orderId, Long baseQuoteId, com.pqc.core.entity.QuoteKind kind);
    List<ServiceQuote> findByBaseQuoteIdAndQuoteKindOrderByVersionDesc(Long baseQuoteId, com.pqc.core.entity.QuoteKind kind);
    List<ServiceQuote> findBySupersedesQuoteId(Long supersedesQuoteId);
    List<ServiceQuote> findByServiceOrderIdAndQuoteKindAndBaseQuoteIdOrderByVersionDesc(Long orderId, com.pqc.core.entity.QuoteKind kind, Long baseQuoteId);
    List<ServiceQuote> findByServiceOrderIdAndQuoteKindOrderByVersionDesc(Long orderId, com.pqc.core.entity.QuoteKind kind);
    @Query(value = "select * from service_quotes where id=:id for update", nativeQuery = true)
    Optional<ServiceQuote> lockAddendum(@Param("id") Long id);
}
