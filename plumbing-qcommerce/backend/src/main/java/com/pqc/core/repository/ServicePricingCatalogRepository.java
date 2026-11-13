package com.pqc.core.repository;

import com.pqc.core.entity.ServicePricingCatalog;
import org.springframework.data.repository.Repository;
import java.util.*;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServicePricingCatalogRepository extends Repository<ServicePricingCatalog, Long> {
    Optional<ServicePricingCatalog> findById(Long id);
    Optional<ServicePricingCatalog> findByCatalogKeyAndCurrencyAndVersion(String catalogKey, String currency, Integer version);
    List<ServicePricingCatalog> findByCatalogKeyAndCurrencyOrderByVersionDesc(String catalogKey, String currency);
    List<ServicePricingCatalog> findByCatalogKeyOrderByVersionDesc(String catalogKey);
    @Query("select c from ServicePricingCatalog c where c.status = 'ACTIVE' and c.currency = :currency and c.effectiveFrom <= CURRENT_TIMESTAMP and (c.effectiveTo is null or c.effectiveTo > CURRENT_TIMESTAMP) order by c.effectiveFrom desc")
    List<ServicePricingCatalog> findCurrentActive(@Param("currency") String currency);
    @Query(value = "select count(*) from service_quotes where pricing_catalog_id = :catalogId", nativeQuery = true)
    long countQuoteReferences(@Param("catalogId") Long catalogId);
    @Query(value = "select count(*) from service_quote_lines l join service_pricing_catalog_lines cl on cl.id = l.pricing_catalog_line_id where cl.pricing_catalog_id = :catalogId", nativeQuery = true)
    long countLineReferences(@Param("catalogId") Long catalogId);
}
