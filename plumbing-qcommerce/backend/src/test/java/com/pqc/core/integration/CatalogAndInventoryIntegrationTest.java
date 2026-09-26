package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Catalog API:
 * - GET /api/v1/catalog/categories (public)
 * - GET /api/v1/catalog/products (public)
 * - GET /api/v1/catalog/products/{id} (public)
 * - GET /api/v1/catalog/search (public)
 * - GET /api/v1/stores/{storeId}/inventory (store manager)
 * - PUT /api/v1/stores/{storeId}/inventory/{productId} (store manager)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogAndInventoryIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired CategoryRepository categoryRepository;
    @Autowired ProductRepository productRepository;
    @Autowired StoreRepository storeRepository;
    @Autowired UserRepository userRepository;
    @Autowired StockRepository stockRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Category category;
    private Product product;
    private Store store;
    private User manager;
    private User customer;
    private String managerToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE outbox_events RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE inventory_reservations RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_order_items RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE service_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stocks RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE products RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE categories RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stores RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE user_addresses RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE wallets RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE notifications RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

        manager = userRepository.save(User.builder()
                .email("storemanager@catalog.test")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Store Manager")
                .phone("9001000001")
                .role(Role.STORE_MANAGER)
                .build());

        customer = userRepository.save(User.builder()
                .email("customer@catalog.test")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Catalog Customer")
                .phone("9001000002")
                .role(Role.CUSTOMER)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Fittings")
                .description("Plumbing fittings and connectors")
                .build());

        product = productRepository.save(Product.builder()
                .sku("ELBOW-90-001")
                .name("90 Degree Elbow")
                .description("Heavy duty 90 degree elbow fitting")
                .price(new BigDecimal("45.00"))
                .imageUrl("elbow.png")
                .category(category)
                .build());

        store = storeRepository.save(Store.builder()
                .name("Catalog Test Store")
                .address("123 Test Street")
                .latitude(18.5204)
                .longitude(73.8567)
                .manager(manager)
                .build());

        stockRepository.save(Stock.builder()
                .store(store)
                .product(product)
                .availableQuantity(100)
                .reservedQuantity(0)
                .build());

        managerToken = "Bearer " + jwtService.generateToken(manager.getEmail(), manager.getRole().name());
        customerToken = "Bearer " + jwtService.generateToken(customer.getEmail(), customer.getRole().name());
    }

    // ========== PUBLIC CATALOG ENDPOINTS ==========

    @Test
    void getCategories_noAuth_returnsPublicList() throws Exception {
        mvc.perform(get("/api/v1/catalog/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Fittings"))
                .andExpect(jsonPath("$[0].description").value("Plumbing fittings and connectors"));
    }

    @Test
    void getCategories_withAnyToken_returnsPublicList() throws Exception {
        mvc.perform(get("/api/v1/catalog/categories")
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getProducts_noAuth_returnsPublicList() throws Exception {
        mvc.perform(get("/api/v1/catalog/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("90 Degree Elbow"))
                .andExpect(jsonPath("$[0].sku").value("ELBOW-90-001"))
                .andExpect(jsonPath("$[0].price").value(45.00));
    }

    @Test
    void getProducts_filteredByCategory_returnsMatchingProducts() throws Exception {
        mvc.perform(get("/api/v1/catalog/products")
                        .param("categoryId", category.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].categoryId").value(category.getId().intValue()));
    }

    @Test
    void getProductById_existingProduct_returnsProduct() throws Exception {
        mvc.perform(get("/api/v1/catalog/products/" + product.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(product.getId().intValue()))
                .andExpect(jsonPath("$.name").value("90 Degree Elbow"))
                .andExpect(jsonPath("$.categoryName").value("Fittings"));
    }

    @Test
    void getProductById_nonExistentProduct_returns404() throws Exception {
        mvc.perform(get("/api/v1/catalog/products/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchProducts_matchingQuery_returnsResults() throws Exception {
        mvc.perform(get("/api/v1/catalog/search")
                        .param("q", "elbow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("90 Degree Elbow"));
    }

    @Test
    void searchProducts_noMatch_returnsEmptyList() throws Exception {
        mvc.perform(get("/api/v1/catalog/search")
                        .param("q", "nonexistentproductxyz123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ========== STORE INVENTORY ENDPOINTS ==========

    @Test
    void updateInventory_storeManagerOfStore_succeeds() throws Exception {
        Map<String, Integer> updateRequest = Map.of("quantity", 50);

        mvc.perform(put("/api/v1/stores/" + store.getId() + "/inventory/" + product.getId())
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableQuantity").value(50));

        // Verify in DB
        var updatedStock = stockRepository.findByStoreIdAndProductId(store.getId(), product.getId());
        assertThat(updatedStock).isPresent();
        assertThat(updatedStock.get().getAvailableQuantity()).isEqualTo(50);
    }

    @Test
    void updateInventory_customer_forbidden() throws Exception {
        Map<String, Integer> updateRequest = Map.of("quantity", 99);

        mvc.perform(put("/api/v1/stores/" + store.getId() + "/inventory/" + product.getId())
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateInventory_unauthenticated_returns401() throws Exception {
        Map<String, Integer> updateRequest = Map.of("quantity", 99);

        mvc.perform(put("/api/v1/stores/" + store.getId() + "/inventory/" + product.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateInventory_negativeQuantity_returns400() throws Exception {
        Map<String, Integer> updateRequest = Map.of("quantity", -10);

        mvc.perform(put("/api/v1/stores/" + store.getId() + "/inventory/" + product.getId())
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }
}
