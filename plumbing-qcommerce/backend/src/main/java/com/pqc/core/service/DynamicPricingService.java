package com.pqc.core.service;

import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.entity.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dynamic Pricing Service — Phase 5 AI Optimization
 *
 * Computes real-time surge multipliers for delivery fees and plumber
 * platform rates based on:
 *   - Current active service order count (PostgreSQL)
 *   - Time-of-day demand windows
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicPricingService {

    private final ServiceOrderRepository serviceOrderRepository;

    // Surge tier thresholds (active order count)
    private static final int MODERATE_THRESHOLD = 6;
    private static final int HIGH_THRESHOLD = 15;

    // Surge multipliers
    private static final double NORMAL_DELIVERY   = 1.00;
    private static final double MODERATE_DELIVERY = 1.20;
    private static final double HIGH_DELIVERY     = 1.50;

    private static final double NORMAL_PLATFORM   = 1.00;
    private static final double MODERATE_PLATFORM = 1.10;
    private static final double HIGH_PLATFORM     = 1.25;

    /**
     * Compute current surge pricing signals.
     *
     * @return map containing surgeLevel, deliverySurge, platformFee multiplier,
     *         activeOrders count, and peakHour flag
     */
    public Map<String, Object> computeSurgePricing() {
        long activeOrders = countActiveOrders();
        boolean isPeakHour = isPeakHour();

        // Apply peak-hour boost: bump to next tier if in peak window
        long effectiveLoad = isPeakHour ? activeOrders + MODERATE_THRESHOLD : activeOrders;

        String surgeLevel;
        double deliverySurge;
        double platformMultiplier;

        if (effectiveLoad >= HIGH_THRESHOLD) {
            surgeLevel        = "HIGH";
            deliverySurge     = HIGH_DELIVERY;
            platformMultiplier = HIGH_PLATFORM;
        } else if (effectiveLoad >= MODERATE_THRESHOLD) {
            surgeLevel        = "MODERATE";
            deliverySurge     = MODERATE_DELIVERY;
            platformMultiplier = MODERATE_PLATFORM;
        } else {
            surgeLevel        = "NORMAL";
            deliverySurge     = NORMAL_DELIVERY;
            platformMultiplier = NORMAL_PLATFORM;
        }

        log.info("Dynamic pricing computed: level={}, activeOrders={}, peakHour={}",
                surgeLevel, activeOrders, isPeakHour);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("surgeLevel", surgeLevel);
        result.put("deliverySurgeMultiplier", deliverySurge);
        result.put("platformFeeMultiplier", platformMultiplier);
        result.put("activeOrders", activeOrders);
        result.put("isPeakHour", isPeakHour);
        result.put("surgeDescription", buildDescription(surgeLevel, deliverySurge));
        return result;
    }

    private long countActiveOrders() {
        return serviceOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.ACCEPTED
                          || o.getStatus() == OrderStatus.IN_PROGRESS
                          || o.getStatus() == OrderStatus.COMBINED_ORDER)
                .count();
    }

    /**
     * Peak hours: morning rush (8–11 AM) and evening rush (5–9 PM).
     */
    private boolean isPeakHour() {
        int hour = LocalTime.now().getHour();
        return (hour >= 8 && hour < 11) || (hour >= 17 && hour < 21);
    }

    private String buildDescription(String level, double multiplier) {
        return switch (level) {
            case "HIGH"     -> String.format("High demand! Delivery rates at %.0fx.", multiplier);
            case "MODERATE" -> String.format("Moderate demand. Delivery rates at %.1fx.", multiplier);
            default         -> "Low demand. Standard rates apply.";
        };
    }
}
