package com.pqc.core.service;

import com.pqc.core.entity.ServicePricingCatalog;
import com.pqc.core.repository.ServicePricingCatalogRepository;
import com.pqc.core.repository.ServicePricingCatalogMutationRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service @RequiredArgsConstructor
public class ServicePricingCatalogService {
    private final ServicePricingCatalogRepository catalogs;
    private final ServicePricingCatalogMutationRepository catalogMutations;
    private final EntityManager entityManager;

    public String normalizeKey(String key) {
        if (key == null || key.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Catalog key is required");
        return key.trim().replaceAll("\\s+", " ").toUpperCase(java.util.Locale.ROOT);
    }

    @Transactional
    public void lockFixtureKey(String rawKey, String rawCurrency) {
        String key = normalizeKey(rawKey);
        String currency = rawCurrency == null ? "" : rawCurrency.trim().toUpperCase(java.util.Locale.ROOT);
        if (!"INR".equals(currency)) throw new IllegalArgumentException("QA labor catalog currency must be INR");
        entityManager.createNativeQuery("select pg_advisory_xact_lock(:key)")
                .setParameter("key", advisoryKey(key, currency)).getSingleResult();
    }


    @Transactional
    public ServicePricingCatalog activate(String rawKey, String rawCurrency, int version, LocalDateTime from, LocalDateTime to) {
        String key = normalizeKey(rawKey); String currency = rawCurrency == null ? "" : rawCurrency.trim().toUpperCase(java.util.Locale.ROOT);
        if (!"INR".equals(currency)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only INR is supported in the first release");
        long lockKey = advisoryKey(key, currency);
        entityManager.createNativeQuery("select pg_advisory_xact_lock(:key)").setParameter("key", lockKey).getSingleResult();
        if (to != null && !to.isAfter(from)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid catalog period");
        boolean overlap = catalogs.findByCatalogKeyAndCurrencyOrderByVersionDesc(key, currency).stream()
                .anyMatch(c -> "ACTIVE".equals(c.getStatus()) && (to == null || c.getEffectiveFrom().isBefore(to))
                        && (c.getEffectiveTo() == null || c.getEffectiveTo().isAfter(from)));
        if (overlap) throw new ResponseStatusException(HttpStatus.CONFLICT, "Catalog activation overlaps an active version");
        ServicePricingCatalog catalog = ServicePricingCatalog.builder().catalogKey(key).currency(currency).version(version)
                .status("ACTIVE").effectiveFrom(from).effectiveTo(to).build();
        return catalogMutations.saveAndFlush(catalog);
    }

    @Transactional
    public ServicePricingCatalog retire(Long catalogId) {
        ServicePricingCatalog catalog = catalogs.findById(catalogId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catalog not found"));
        catalog.setStatus("RETIRED");
        return catalogMutations.save(catalog);
    }

    @Transactional
    public ServicePricingCatalog updateCurrency(Long catalogId, String rawCurrency) {
        ServicePricingCatalog catalog = catalogs.findById(catalogId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catalog not found"));
        assertMutable(catalogId);
        String currency = rawCurrency == null ? "" : rawCurrency.trim().toUpperCase(java.util.Locale.ROOT);
        if (!"INR".equals(currency)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only INR is supported in the first release");
        catalog.setCurrency(currency);
        return catalogMutations.save(catalog);
    }

    @Transactional
    public ServicePricingCatalog updateEffectivePeriod(Long catalogId, LocalDateTime from, LocalDateTime to) {
        ServicePricingCatalog catalog = catalogs.findById(catalogId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catalog not found"));
        assertMutable(catalogId);
        if (from == null || (to != null && !to.isAfter(from))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid catalog period");
        catalog.setEffectiveFrom(from);
        catalog.setEffectiveTo(to);
        return catalogMutations.save(catalog);
    }

    @Transactional
    public void delete(Long catalogId) {
        if (catalogs.countQuoteReferences(catalogId) > 0 || catalogs.countLineReferences(catalogId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Referenced pricing catalog versions are immutable");
        }
        catalogMutations.deleteById(catalogId);
    }

    public void assertMutable(Long catalogId) {
        if (catalogs.countQuoteReferences(catalogId) > 0 || catalogs.countLineReferences(catalogId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Referenced pricing catalog versions are immutable");
        }
    }

    private long advisoryKey(String key, String currency) {
        try { byte[] hash = MessageDigest.getInstance("SHA-256").digest((key + "|" + currency).getBytes(StandardCharsets.UTF_8));
            return java.nio.ByteBuffer.wrap(hash).getLong();
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
}
