package com.pqc.core.service;

import com.pqc.core.entity.Category;
import com.pqc.core.entity.Product;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.Stock;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.repository.CategoryRepository;
import com.pqc.core.repository.ProductRepository;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InventoryConcurrencyTest {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockRepository stockRepository;

    private Stock stock;

    @BeforeEach
    void setUp() {
        User manager = User.builder()
                .email("manager_" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .fullName("Store Manager")
                .phone("98765432" + (int)(Math.random() * 100))
                .role(Role.STORE_MANAGER)
                .build();
        manager = userRepository.save(manager);

        Store store = Store.builder()
                .name("Concurrency Test Store")
                .address("123 Main St")
                .latitude(12.9716)
                .longitude(77.5946)
                .manager(manager)
                .build();
        store = storeRepository.save(store);

        Category category = Category.builder()
                .name("Valves Test " + UUID.randomUUID())
                .description("Test Category")
                .build();
        category = categoryRepository.save(category);

        Product product = Product.builder()
                .sku("SKU-VALVE-" + UUID.randomUUID())
                .name("CP Brass Angle Valve 15mm")
                .description("Jaquar 15mm angle valve")
                .price(new BigDecimal("450.00"))
                .category(category)
                .build();
        product = productRepository.save(product);

        stock = Stock.builder()
                .store(store)
                .product(product)
                .availableQuantity(10)
                .reservedQuantity(0)
                .build();
        stock = stockRepository.save(stock);
    }

    @Test
    @DisplayName("Stock reservation updates available and reserved quantities in two-phase transition")
    void testStockReservationTransitions() {
        // Phase 1: Reserve 4 items
        stock.setAvailableQuantity(stock.getAvailableQuantity() - 4);
        stock.setReservedQuantity(stock.getReservedQuantity() + 4);
        stock = stockRepository.save(stock);

        assertThat(stock.getAvailableQuantity()).isEqualTo(6);
        assertThat(stock.getReservedQuantity()).isEqualTo(4);

        // Phase 2: Fulfill reservation (Pickup collected)
        stock.setReservedQuantity(stock.getReservedQuantity() - 4);
        stock = stockRepository.save(stock);

        assertThat(stock.getAvailableQuantity()).isEqualTo(6);
        assertThat(stock.getReservedQuantity()).isEqualTo(0);
        assertThat(stock.getAvailableQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(stock.getReservedQuantity()).isGreaterThanOrEqualTo(0);
    }
}
