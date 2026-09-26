package com.pqc.core.service;

import com.pqc.core.dto.StockUpdateRequest;
import com.pqc.core.entity.Product;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.Stock;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.StoreBusinessHours;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ProductRepository;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.repository.StoreBusinessHoursRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserService userService;
    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final StoreBusinessHoursRepository storeBusinessHoursRepository;
    private final ProductOrderRepository productOrderRepository;
    private final CurrentUser currentUser;

    public Store createStore(Store store, String managerEmail) {
        User manager = userService.getUserByEmail(managerEmail);
        store.setManager(manager);
        return storeRepository.save(store);
    }

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public Store getStoreById(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + id));
    }

    public Store getCurrentStoreForManager() {
        User user = currentUser.require();
        if (user.getRole() == Role.ADMIN) {
            return storeRepository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No stores are available"));
        }
        if (user.getRole() != Role.STORE_MANAGER) {
            throw new AccessDeniedException("Only store managers or admins can access the current store profile");
        }
        return storeRepository.findFirstByManager_Id(user.getId())
                .orElseThrow(() -> new RuntimeException("Store profile not found for the current manager"));
    }

    @Transactional
    public Stock updateStock(Long storeId, Long productId, StockUpdateRequest request) {
        if (request.getQuantity() < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + storeId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        User user = currentUser.require();
        if (user.getRole() != Role.ADMIN) {
            if (user.getRole() != Role.STORE_MANAGER || store.getManager() == null || !store.getManager().getId().equals(user.getId())) {
                throw new AccessDeniedException("Only store manager or admin can update inventory");
            }
        }

        Stock stock = stockRepository.findByStoreIdAndProductId(storeId, productId)
                .orElseGet(() -> Stock.builder()
                        .store(store)
                        .product(product)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .lowStockThreshold(5)
                        .build());

        stock.setAvailableQuantity(request.getQuantity());
        return stockRepository.save(stock);
    }

    @Transactional
    public Stock updateLowStockThreshold(Long storeId, Long productId, Integer threshold) {
        if (threshold == null || threshold < 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Low stock threshold cannot be negative");
        }
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + storeId));

        User user = currentUser.require();
        if (user.getRole() != Role.ADMIN) {
            if (user.getRole() != Role.STORE_MANAGER || store.getManager() == null || !store.getManager().getId().equals(user.getId())) {
                throw new AccessDeniedException("Only store manager or admin can update low stock threshold");
            }
        }

        if (threshold != null && threshold < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Low stock threshold cannot be negative");
        }

        Stock stock = stockRepository.findByStoreIdAndProductId(storeId, productId)
                .orElseThrow(() -> new RuntimeException("Stock record not found for product ID: " + productId));

        stock.setLowStockThreshold(threshold);
        return stockRepository.save(stock);
    }

    @Transactional
    public Stock addCatalogProductToInventory(Long productId, Integer initialQuantity, Integer lowStockThreshold) {
        if (initialQuantity != null && initialQuantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Initial quantity cannot be negative");
        }
        if (lowStockThreshold != null && lowStockThreshold < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Low stock threshold cannot be negative");
        }
        Store store = getCurrentStoreForManager();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Catalog Product not found with ID: " + productId));

        Stock stock = stockRepository.findByStoreIdAndProductId(store.getId(), productId)
                .orElseGet(() -> Stock.builder()
                        .store(store)
                        .product(product)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .lowStockThreshold(lowStockThreshold != null ? lowStockThreshold : 5)
                        .build());

        if (initialQuantity != null && initialQuantity >= 0) {
            stock.setAvailableQuantity(initialQuantity);
        }
        if (lowStockThreshold != null && lowStockThreshold >= 0) {
            stock.setLowStockThreshold(lowStockThreshold);
        }
        return stockRepository.save(stock);
    }

    @Transactional
    public Store updateCurrentStoreProfile(Store updateRequest) {
        Store current = getCurrentStoreForManager();
        if (updateRequest.getName() != null && !updateRequest.getName().isBlank()) {
            current.setName(updateRequest.getName());
        }
        if (updateRequest.getAddress() != null && !updateRequest.getAddress().isBlank()) {
            current.setAddress(updateRequest.getAddress());
        }
        if (updateRequest.getLatitude() != null) {
            current.setLatitude(updateRequest.getLatitude());
        }
        if (updateRequest.getLongitude() != null) {
            current.setLongitude(updateRequest.getLongitude());
        }
        return storeRepository.save(current);
    }

    @Transactional(readOnly = true)
    public List<StoreBusinessHours> getStoreBusinessHours() {
        Store store = getCurrentStoreForManager();
        List<StoreBusinessHours> list = storeBusinessHoursRepository.findByStoreId(store.getId());
        if (list.isEmpty()) {
            // Provide default schedule if none exists
            List<String> days = List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");
            List<StoreBusinessHours> defaults = new ArrayList<>();
            for (String day : days) {
                defaults.add(StoreBusinessHours.builder()
                        .store(store)
                        .dayOfWeek(day)
                        .openTime(day.equals("SUNDAY") ? java.time.LocalTime.of(9, 0) : java.time.LocalTime.of(8, 0))
                        .closeTime(day.equals("SUNDAY") ? java.time.LocalTime.of(16, 0) : java.time.LocalTime.of(20, 0))
                        .closed(false)
                        .build());
            }
            return defaults;
        }
        return list;
    }

    @Transactional
    public List<StoreBusinessHours> updateStoreBusinessHours(List<StoreBusinessHours> hoursList) {
        Store store = getCurrentStoreForManager();
        List<StoreBusinessHours> saved = new ArrayList<>();
        if (hoursList != null) {
            for (StoreBusinessHours item : hoursList) {
                if (item.getDayOfWeek() == null) continue;
                java.time.LocalTime open = item.getOpenTime() != null ? item.getOpenTime() : java.time.LocalTime.of(8, 0);
                java.time.LocalTime close = item.getCloseTime() != null ? item.getCloseTime() : java.time.LocalTime.of(20, 0);
                boolean isClosed = Boolean.TRUE.equals(item.getClosed());
                if (!isClosed && !close.isAfter(open)) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, "Close time must be after open time for " + item.getDayOfWeek());
                }
                StoreBusinessHours existing = storeBusinessHoursRepository
                        .findByStoreIdAndDayOfWeek(store.getId(), item.getDayOfWeek())
                        .orElseGet(() -> StoreBusinessHours.builder()
                                .store(store)
                                .dayOfWeek(item.getDayOfWeek())
                                .build());
                existing.setOpenTime(open);
                existing.setCloseTime(close);
                existing.setClosed(isClosed);
                saved.add(storeBusinessHoursRepository.save(existing));
            }
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyReportSummary(int year, int month) {
        Store store = getCurrentStoreForManager();
        List<ProductOrder> allRequests = productOrderRepository.findByStore_Manager_IdAndServiceOrderIsNotNull(store.getManager().getId());
        
        long totalRequests = allRequests.size();
        long completedHandovers = allRequests.stream().filter(r -> r.getStatus() == ProductOrderStatus.COLLECTED).count();
        long activeFulfillment = allRequests.stream().filter(r -> r.getStatus() != ProductOrderStatus.COLLECTED && r.getStatus() != ProductOrderStatus.REJECTED && r.getStatus() != ProductOrderStatus.CANCELLED).count();
        BigDecimal totalMaterialValue = allRequests.stream()
                .map(r -> r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new HashMap<>();
        report.put("storeId", store.getId());
        report.put("storeName", store.getName());
        report.put("period", String.format("%d-%02d", year, month));
        report.put("totalRequests", totalRequests);
        report.put("completedHandovers", completedHandovers);
        report.put("activeFulfillment", activeFulfillment);
        report.put("totalMaterialValue", totalMaterialValue);
        report.put("generatedAt", LocalDateTime.now().toString());
        return report;
    }

    public byte[] generateMonthlyReportPdf(int year, int month) {
        Map<String, Object> summary = getMonthlyReportSummary(year, month);
        
        // Simple, clean PDF-formatted text document buffer
        StringBuilder pdfContent = new StringBuilder();
        pdfContent.append("%PDF-1.4\n");
        pdfContent.append("% FixKart Hardware Store Monthly Operational Report\n\n");
        pdfContent.append("STORE OPERATIONAL SUMMARY REPORT\n");
        pdfContent.append("=====================================\n");
        pdfContent.append("Store Name: ").append(summary.get("storeName")).append("\n");
        pdfContent.append("Report Period: ").append(summary.get("period")).append("\n");
        pdfContent.append("Generated At: ").append(summary.get("generatedAt")).append("\n\n");
        pdfContent.append("METRICS:\n");
        pdfContent.append("- Total Material Requests: ").append(summary.get("totalRequests")).append("\n");
        pdfContent.append("- Completed Handovers: ").append(summary.get("completedHandovers")).append("\n");
        pdfContent.append("- Active Fulfillment Requests: ").append(summary.get("activeFulfillment")).append("\n");
        pdfContent.append("- Total Material Request Value: ₹").append(summary.get("totalMaterialValue")).append("\n\n");
        pdfContent.append("Financial payouts & payment settlements remain deferred.\n");
        pdfContent.append("EOF\n");

        return pdfContent.toString().getBytes(StandardCharsets.UTF_8);
    }
}
