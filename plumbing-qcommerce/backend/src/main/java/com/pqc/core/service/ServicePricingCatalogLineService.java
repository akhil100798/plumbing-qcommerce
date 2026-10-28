package com.pqc.core.service;

import com.pqc.core.entity.ServicePricingCatalogLine;
import com.pqc.core.repository.ServicePricingCatalogLineRepository;
import com.pqc.core.repository.ServicePricingCatalogLineMutationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** The only mutation boundary for catalog lines. Referenced versions are immutable. */
@Service
@RequiredArgsConstructor
public class ServicePricingCatalogLineService {
    private final ServicePricingCatalogLineRepository lines;
    private final ServicePricingCatalogLineMutationRepository lineMutations;
    private final ServicePricingCatalogService catalogs;

    @Transactional
    public ServicePricingCatalogLine create(Long catalogId, String lineKey, String lineType, BigDecimal amount,
                                            String unit, BigDecimal minQuantity, BigDecimal maxQuantity) {
        validate(lineKey, lineType, amount, unit, minQuantity, maxQuantity);
        catalogs.assertMutable(catalogId);
        return lineMutations.save(ServicePricingCatalogLine.builder().pricingCatalogId(catalogId)
                .lineKey(lineKey.trim()).lineType(lineType.trim().toUpperCase(java.util.Locale.ROOT))
                .amount(amount.setScale(2, RoundingMode.HALF_UP)).unit(unit.trim())
                .minQuantity(minQuantity.setScale(2, RoundingMode.UNNECESSARY))
                .maxQuantity(maxQuantity.setScale(2, RoundingMode.UNNECESSARY)).build());
    }

    @Transactional
    public ServicePricingCatalogLine updateQuantityBounds(Long lineId, String unit, BigDecimal minQuantity,
                                                            BigDecimal maxQuantity) {
        ServicePricingCatalogLine line = lines.findById(lineId).orElseThrow();
        validate(line.getLineKey(), line.getLineType(), line.getAmount(), unit, minQuantity, maxQuantity);
        catalogs.assertMutable(line.getPricingCatalogId());
        line.setUnit(unit.trim());
        line.setMinQuantity(minQuantity.setScale(2, RoundingMode.UNNECESSARY));
        line.setMaxQuantity(maxQuantity.setScale(2, RoundingMode.UNNECESSARY));
        return lineMutations.save(line);
    }

    @Transactional
    public ServicePricingCatalogLine updateAmount(Long lineId, BigDecimal amount) {
        if (amount == null || amount.signum() < 0) throw new IllegalArgumentException("Catalog price must be non-negative");
        ServicePricingCatalogLine line = lines.findById(lineId).orElseThrow();
        catalogs.assertMutable(line.getPricingCatalogId());
        line.setAmount(amount);
        return lineMutations.save(line);
    }

    @Transactional
    public void delete(Long lineId) {
        ServicePricingCatalogLine line = lines.findById(lineId).orElseThrow();
        catalogs.assertMutable(line.getPricingCatalogId());
        lineMutations.delete(line);
    }

    private void validate(String lineKey, String lineType, BigDecimal amount, String unit,
                          BigDecimal minQuantity, BigDecimal maxQuantity) {
        if (lineKey == null || lineKey.isBlank()) throw new IllegalArgumentException("Catalog line key is required");
        if (lineType == null || !java.util.Set.of("LABOR", "MATERIAL", "VISIT", "OTHER").contains(lineType.trim().toUpperCase(java.util.Locale.ROOT)))
            throw new IllegalArgumentException("Unsupported catalog line type");
        if (amount == null || amount.signum() < 0) throw new IllegalArgumentException("Catalog price must be non-negative");
        if (unit == null || unit.isBlank() || unit.length() > 32) throw new IllegalArgumentException("Catalog unit is required");
        validateQuantity(minQuantity, "Minimum quantity");
        validateQuantity(maxQuantity, "Maximum quantity");
        if (minQuantity.signum() <= 0) throw new IllegalArgumentException("Minimum quantity must be positive");
        if (maxQuantity.compareTo(minQuantity) < 0) throw new IllegalArgumentException("Maximum quantity must be at least minimum quantity");
    }

    private void validateQuantity(BigDecimal quantity, String label) {
        if (quantity == null || quantity.signum() <= 0 || quantity.stripTrailingZeros().scale() > 2
                || quantity.precision() - quantity.scale() > 8) {
            throw new IllegalArgumentException(label + " must be positive and fit DECIMAL(10,2)");
        }
    }
}
