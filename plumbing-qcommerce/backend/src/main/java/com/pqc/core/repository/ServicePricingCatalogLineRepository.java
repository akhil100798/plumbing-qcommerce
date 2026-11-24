package com.pqc.core.repository;

import com.pqc.core.entity.ServicePricingCatalogLine;
import org.springframework.data.repository.Repository;
import java.util.List;

public interface ServicePricingCatalogLineRepository extends Repository<ServicePricingCatalogLine, Long> {
    java.util.Optional<ServicePricingCatalogLine> findById(Long id);
    List<ServicePricingCatalogLine> findByPricingCatalogId(Long pricingCatalogId);
}
