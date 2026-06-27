package com.pqc.core.controller;

import com.pqc.core.entity.Store;
import com.pqc.core.entity.Stock;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.ArrayList;

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

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Store> getStoreById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
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
        double earthRadius = 6371; // kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}

