package com.pqc.core.service;

import com.pqc.core.entity.ServicePricingCatalog;
import com.pqc.core.entity.ServicePricingCatalogLine;
import com.pqc.core.repository.ServicePricingCatalogLineRepository;
import com.pqc.core.repository.ServicePricingCatalogRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** QA-only atomic create-or-compare flow built on the production mutation boundaries. */
@Service
@RequiredArgsConstructor
public class QaLaborCatalogFixtureService {
    private final ServicePricingCatalogService catalogService;
    private final ServicePricingCatalogLineService lineService;
    private final ServicePricingCatalogRepository catalogs;
    private final ServicePricingCatalogLineRepository lines;

    @Transactional
    public void ensureFixture(Fixture fixture) {
        if (fixture == null || fixture.key() == null || fixture.currency() == null) {
            throw new IllegalArgumentException("QA labor catalog key and currency are required");
        }
        String key = catalogService.normalizeKey(fixture.key());
        if (key.length() > 160) throw new IllegalArgumentException("QA labor catalog key exceeds 160 characters");
        String currency = fixture.currency().trim().toUpperCase(java.util.Locale.ROOT);
        if (!"INR".equals(currency)) {
            throw new IllegalArgumentException("QA labor catalog currency must be INR");
        }
        validateFixture(fixture);

        catalogService.lockFixtureKey(key, currency);

        List<ServicePricingCatalog> existing = catalogs.findByCatalogKeyOrderByVersionDesc(key);
        List<ServicePricingCatalog> active = existing.stream()
                .filter(catalog -> "ACTIVE".equals(catalog.getStatus()))
                .toList();
        if (!active.isEmpty()) {
            if (active.size() != 1) {
                throw mismatch();
            }
            ServicePricingCatalog catalog = active.get(0);
            List<ServicePricingCatalogLine> catalogLines = lines.findByPricingCatalogId(catalog.getId());
            if (!currency.equals(catalog.getCurrency()) || !"ACTIVE".equals(catalog.getStatus())
                    || catalog.getEffectiveFrom() == null || catalog.getEffectiveFrom().isAfter(LocalDateTime.now())
                    || (catalog.getEffectiveTo() != null && !catalog.getEffectiveTo().isAfter(LocalDateTime.now()))
                    || catalogLines.size() != 1 || !matches(catalogLines.get(0), fixture)) {
                throw mismatch();
            }
            return;
        }
        if (!existing.isEmpty()) {
            throw mismatch();
        }

        // Version and effective dates are generated setup metadata, not owner fixture values.
        LocalDateTime now = LocalDateTime.now();
        ServicePricingCatalog catalog = catalogService.activate(key, currency, 1, now, null);
        lineService.create(catalog.getId(), fixture.lineKey(), "LABOR", fixture.amount(), fixture.unit(),
                fixture.minQuantity(), fixture.maxQuantity());
    }

    private void validateFixture(Fixture fixture) {
        if (fixture.lineKey() == null || fixture.lineKey().isBlank() || fixture.lineKey().trim().length() > 160) {
            throw new IllegalArgumentException("QA labor catalog line key is required");
        }
        if (fixture.amount() == null || fixture.amount().signum() < 0) {
            throw new IllegalArgumentException("QA labor catalog amount must be non-negative");
        }
        if (fixture.amount().stripTrailingZeros().scale() > 2
                || fixture.amount().precision() - fixture.amount().scale() > 17) {
            throw new IllegalArgumentException("QA labor catalog amount must fit DECIMAL(19,2)");
        }
        if (fixture.unit() == null || fixture.unit().isBlank() || fixture.unit().trim().length() > 32) {
            throw new IllegalArgumentException("QA labor catalog unit is required");
        }
        if (fixture.minQuantity() == null || fixture.maxQuantity() == null
                || fixture.minQuantity().signum() <= 0
                || fixture.maxQuantity().compareTo(fixture.minQuantity()) < 0) {
            throw new IllegalArgumentException("QA labor catalog quantity bounds are invalid");
        }
        validateQuantityPrecision(fixture.minQuantity(), "minimum");
        validateQuantityPrecision(fixture.maxQuantity(), "maximum");
    }

    private void validateQuantityPrecision(BigDecimal quantity, String label) {
        if (quantity.stripTrailingZeros().scale() > 2 || quantity.precision() - quantity.scale() > 8) {
            throw new IllegalArgumentException("QA labor catalog " + label + " quantity must fit DECIMAL(10,2)");
        }
    }

    private boolean matches(ServicePricingCatalogLine line, Fixture fixture) {
        return fixture.lineKey().trim().equals(line.getLineKey()) && "LABOR".equals(line.getLineType())
                && fixture.amount().compareTo(line.getAmount()) == 0
                && fixture.unit().trim().equals(line.getUnit())
                && fixture.minQuantity().compareTo(line.getMinQuantity()) == 0
                && fixture.maxQuantity().compareTo(line.getMaxQuantity()) == 0;
    }

    private IllegalStateException mismatch() {
        return new IllegalStateException("Existing QA labor catalog does not exactly match the requested fixture");
    }

    public record Fixture(String key, String currency, String lineKey, BigDecimal amount,
                          String unit, BigDecimal minQuantity, BigDecimal maxQuantity) {}
}
