package com.pqc.core.service;

import com.pqc.core.dto.StockUpdateRequest;
import com.pqc.core.entity.Product;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.Stock;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ProductRepository;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.repository.StoreRepository;
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
                        .build());

        stock.setAvailableQuantity(request.getQuantity());
        return stockRepository.save(stock);
    }
}
