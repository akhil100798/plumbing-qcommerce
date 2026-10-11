package com.pqc.core.repository;

import com.pqc.core.entity.ServiceQuoteLine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceQuoteLineRepository extends JpaRepository<ServiceQuoteLine, Long> {
    List<ServiceQuoteLine> findByQuoteIdOrderByIdAsc(Long quoteId);
    default void deleteByQuoteIdAndFlush(Long quoteId) {
        deleteAll(findByQuoteIdOrderByIdAsc(quoteId));
        flush();
    }
}
