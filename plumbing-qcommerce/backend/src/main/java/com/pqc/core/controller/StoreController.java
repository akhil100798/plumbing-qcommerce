package com.pqc.core.controller;

import com.pqc.core.entity.Stock;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.StoreBusinessHours;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final StockRepository stockRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Store> createStore(@jakarta.validation.Valid @RequestBody Store store, @RequestParam String managerEmail) {
        return ResponseEntity.ok(storeService.createStore(store, managerEmail));
    }

    @PutMapping("/{storeId}/inventory/{productId}")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Stock> updateStock(
            @PathVariable Long storeId,
            @PathVariable Long productId,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.StockUpdateRequest request) {
        return ResponseEntity.ok(storeService.updateStock(storeId, productId, request));
    }

    @PatchMapping("/{storeId}/inventory/{productId}/threshold")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Stock> updateLowStockThreshold(
            @PathVariable Long storeId,
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body) {
        Integer threshold = body != null ? body.get("lowStockThreshold") : 5;
        return ResponseEntity.ok(storeService.updateLowStockThreshold(storeId, productId, threshold));
    }

    @PostMapping("/me/inventory")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Stock> addCatalogProductToInventory(@RequestBody AddCatalogProductRequest body) {
        return ResponseEntity.ok(storeService.addCatalogProductToInventory(
                body.productId(), body.initialQuantity(), body.lowStockThreshold()));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Store> getCurrentStore() {
        return ResponseEntity.ok(storeService.getCurrentStoreForManager());
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Store> updateCurrentStore(@RequestBody Store request) {
        return ResponseEntity.ok(storeService.updateCurrentStoreProfile(request));
    }

    @GetMapping("/me/business-hours")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<StoreBusinessHours>> getBusinessHours() {
        return ResponseEntity.ok(storeService.getStoreBusinessHours());
    }

    @PutMapping("/me/business-hours")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<StoreBusinessHours>> updateBusinessHours(@RequestBody List<StoreBusinessHours> hours) {
        return ResponseEntity.ok(storeService.updateStoreBusinessHours(hours));
    }

    @GetMapping("/me/reports/monthly")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(defaultValue = "5") int month) {
        return ResponseEntity.ok(storeService.getMonthlyReportSummary(year, month));
    }

    @GetMapping("/me/reports/monthly/pdf")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<byte[]> getMonthlyReportPdf(
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(defaultValue = "5") int month) {
        byte[] pdf = storeService.generateMonthlyReportPdf(year, month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=monthly-report-" + year + "-" + month + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Store> getStoreById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @GetMapping("/me/inventory")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<Stock>> getCurrentStoreInventory() {
        Store store = storeService.getCurrentStoreForManager();
        return ResponseEntity.ok(stockRepository.findByStoreId(store.getId()));
    }

    @GetMapping("/{id}/inventory")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Stock>> getStoreInventory(@PathVariable Long id) {
        return ResponseEntity.ok(stockRepository.findByStoreId(id));
    }

    @GetMapping("/nearby")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Store>> getNearbyStores(@RequestParam double lat, @RequestParam double lng) {
        List<Store> stores = new ArrayList<>(storeService.getAllStores());
        stores.sort((s1, s2) -> {
            double d1 = calculateDistance(lat, lng, s1.getLatitude(), s1.getLongitude());
            double d2 = calculateDistance(lat, lng, s2.getLatitude(), s2.getLongitude());
            return Double.compare(d1, d2);
        });
        return ResponseEntity.ok(stores);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    public record AddCatalogProductRequest(Long productId, Integer initialQuantity, Integer lowStockThreshold) {}
}
