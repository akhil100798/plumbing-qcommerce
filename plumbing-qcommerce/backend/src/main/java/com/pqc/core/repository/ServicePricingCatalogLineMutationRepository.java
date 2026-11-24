package com.pqc.core.repository;

import com.pqc.core.entity.ServicePricingCatalogLine;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** Mutation adapter reserved for ServicePricingCatalogLineService. */
@Repository
@RequiredArgsConstructor
public class ServicePricingCatalogLineMutationRepository {
    private final EntityManager entityManager;

    public ServicePricingCatalogLine save(ServicePricingCatalogLine line) {
        return entityManager.merge(line);
    }

    public ServicePricingCatalogLine saveAndFlush(ServicePricingCatalogLine line) {
        ServicePricingCatalogLine saved = save(line);
        entityManager.flush();
        return saved;
    }

    public void delete(ServicePricingCatalogLine line) {
        entityManager.remove(entityManager.contains(line) ? line : entityManager.merge(line));
    }
}
