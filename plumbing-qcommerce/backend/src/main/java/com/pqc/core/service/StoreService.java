package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.dto.StockUpdateRequest;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserService userService;
    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
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
                        .build());

        stock.setAvailableQuantity(request.getQuantity());
        return stockRepository.save(stock);
    }
}
