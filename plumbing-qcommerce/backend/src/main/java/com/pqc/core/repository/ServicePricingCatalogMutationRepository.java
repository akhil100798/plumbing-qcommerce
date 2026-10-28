package com.pqc.core.repository;

import com.pqc.core.entity.ServicePricingCatalog;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** Package-facing persistence adapter; guarded catalog services are its only production callers. */
@Repository
@RequiredArgsConstructor
public class ServicePricingCatalogMutationRepository {
    private final EntityManager entityManager;

    public ServicePricingCatalog save(ServicePricingCatalog catalog) {
        return entityManager.getEntityManagerFactory().getPersistenceUnitUtil().getIdentifier(catalog) == null
                ? persist(catalog) : entityManager.merge(catalog);
    }

    public ServicePricingCatalog saveAndFlush(ServicePricingCatalog catalog) {
        ServicePricingCatalog saved = save(catalog);
        entityManager.flush();
        return saved;
    }

    public void deleteById(Long id) {
        ServicePricingCatalog catalog = entityManager.find(ServicePricingCatalog.class, id);
        if (catalog != null) entityManager.remove(catalog);
    }

    private ServicePricingCatalog persist(ServicePricingCatalog catalog) {
        entityManager.persist(catalog);
        return catalog;
    }
}
