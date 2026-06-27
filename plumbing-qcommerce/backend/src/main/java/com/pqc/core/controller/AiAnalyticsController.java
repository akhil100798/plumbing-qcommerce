package com.pqc.core.controller;

import com.pqc.core.service.BundleSuggestionService;
import com.pqc.core.service.DemandForecastService;
import com.pqc.core.service.DynamicPricingService;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.entity.ProductOrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Analytics Controller — Phase 5
 *
 * Surfaces AI-powered insights to the Admin Portal:
 *   - Demand forecasting from MongoDB audit logs
 *   - Dynamic pricing surge signals
 *   - Bundle suggestions keyed by service type
 *   - Dashboard KPI metrics
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Slf4j
public class AiAnalyticsController {

    private final DemandForecastService demandForecastService;
    private final DynamicPricingService dynamicPricingService;
    private final BundleSuggestionService bundleSuggestionService;
    private final ServiceOrderRepository serviceOrderRepository;
    private final ProductOrderRepository productOrderRepository;

    /**
     * GET /api/v1/ai/demand-forecast
     * Returns top N products by demand score with stock status and trend.
     */
    @GetMapping("/demand-forecast")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getDemandForecast(
            @RequestParam(defaultValue = "10") int topN) {
        log.info("AI demand forecast requested for top {} products", topN);
        return ResponseEntity.ok(demandForecastService.getTopDemandedProducts(topN));
    }

    /**
     * GET /api/v1/ai/dynamic-pricing
     * Returns current surge multipliers and surge tier.
     */
    @GetMapping("/dynamic-pricing")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<Map<String, Object>> getDynamicPricing() {
        log.info("AI dynamic pricing signal requested");
        return ResponseEntity.ok(dynamicPricingService.computeSurgePricing());
    }

    /**
     * GET /api/v1/ai/bundle-suggestions?serviceType=NEARBY_AUTO
     * Returns product bundle recommendations for a given service type.
     */
    @GetMapping("/bundle-suggestions")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_MANAGER', 'CUSTOMER')")
    public ResponseEntity<Map<String, Object>> getBundleSuggestions(
            @RequestParam(defaultValue = "NEARBY_AUTO") String serviceType) {
        log.info("Bundle suggestions requested for service type: {}", serviceType);
        List<Map<String, String>> suggestions = bundleSuggestionService.getSuggestionsForServiceType(serviceType);
        List<String> availableTypes = bundleSuggestionService.getAvailableServiceTypes();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("serviceType", serviceType);
        response.put("suggestions", suggestions);
        response.put("availableServiceTypes", availableTypes);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/ai/dashboard-metrics
     * Returns aggregated KPIs for the Admin Portal dashboard header.
     */
    @GetMapping("/dashboard-metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        log.info("Dashboard KPI metrics requested");

        // Total orders today (product orders confirmed today)
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(java.time.LocalTime.MAX);
        long ordersToday = productOrderRepository.countByCreatedAtBetween(startOfToday, endOfToday);

        // Total daily revenue from completed service orders
        BigDecimal revenue = serviceOrderRepository.sumCompletedOrdersRevenue();
        if (revenue == null) revenue = BigDecimal.ZERO;

        // Active plumbers (orders in ACCEPTED / IN_PROGRESS / COMBINED_ORDER)
        long activePlumbers = serviceOrderRepository.countDistinctActivePlumbers(List.of(
                com.pqc.core.entity.OrderStatus.ACCEPTED,
                com.pqc.core.entity.OrderStatus.IN_PROGRESS,
                com.pqc.core.entity.OrderStatus.COMBINED_ORDER
        ));

        // Low stock alerts
        long lowStockAlerts = demandForecastService.getLowStockAlertCount();

        // Orders trend: last 7 days
        List<Map<String, Object>> ordersTrend = buildOrdersTrend();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("ordersToday", ordersToday);
        metrics.put("dailyRevenue", revenue);
        metrics.put("activePlumbers", activePlumbers);
        metrics.put("lowStockAlerts", lowStockAlerts);
        metrics.put("ordersTrend", ordersTrend);

        return ResponseEntity.ok(metrics);
    }

    /** Build a 7-day rolling orders trend from product orders */
    private List<Map<String, Object>> buildOrdersTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = day.atTime(java.time.LocalTime.MAX);
            long count = productOrderRepository.countByCreatedAtBetween(start, end);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.toString());
            point.put("orders", count);
            trend.add(point);
        }
        return trend;
    }
}
