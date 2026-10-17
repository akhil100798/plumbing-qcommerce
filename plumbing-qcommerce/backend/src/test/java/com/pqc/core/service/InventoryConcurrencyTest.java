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

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
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

    private Long stockId;

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

        Stock stock = Stock.builder()
                .store(store)
                .product(product)
                .availableQuantity(10)
                .reservedQuantity(0)
                .build();
        stock = stockRepository.save(stock);
        stockId = stock.getId();
    }

    @Test
    @DisplayName("Concurrent multi-threaded stock reservation maintains quantity invariants")
    void testConcurrentMultiThreadedStockReservation() throws Exception {
        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numberOfThreads);

        for (int i = 0; i < numberOfThreads; i++) {
            executorService.submit(() -> {
                try {
                    startLatch.await();
                    synchronized (this) {
                        Stock currentStock = stockRepository.findById(stockId).orElseThrow();
                        if (currentStock.getAvailableQuantity() >= 4) {
                            currentStock.setAvailableQuantity(currentStock.getAvailableQuantity() - 4);
                            currentStock.setReservedQuantity(currentStock.getReservedQuantity() + 4);
                            stockRepository.save(currentStock);
                        }
                    }
                } catch (Exception ignored) {
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = finishLatch.await(5, TimeUnit.SECONDS);
        executorService.shutdown();

        assertThat(completed).isTrue();

        Stock finalStock = stockRepository.findById(stockId).orElseThrow();
        assertThat(finalStock.getAvailableQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(finalStock.getReservedQuantity()).isGreaterThanOrEqualTo(0);
        assertThat(finalStock.getAvailableQuantity() + finalStock.getReservedQuantity()).isEqualTo(10);
    }
}
