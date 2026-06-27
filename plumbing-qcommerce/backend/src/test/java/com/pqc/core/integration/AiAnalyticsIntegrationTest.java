package com.pqc.core.integration;

import com.pqc.core.entity.User;
import com.pqc.core.entity.Role;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.DemandForecastService;
import com.pqc.core.service.DynamicPricingService;
import com.pqc.core.service.BundleSuggestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AiAnalyticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private DemandForecastService demandForecastService;

    @MockitoBean
    private DynamicPricingService dynamicPricingService;

    @MockitoBean
    private BundleSuggestionService bundleSuggestionService;

    @MockitoBean
    private ProductOrderRepository productOrderRepository;

    @MockitoBean
    private ServiceOrderRepository serviceOrderRepository;

    private String adminToken;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE outbox_events RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE inventory_reservations RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_order_items RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE service_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stocks RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stores RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE user_addresses RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE wallets RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE notifications RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

        User admin = userRepository.save(User.builder()
                .email("admin@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Admin User")
                .phone("9999999999")
                .role(Role.ADMIN)
                .build());
        adminToken = "Bearer " + jwtService.generateToken(admin.getEmail(), admin.getRole().name());
    }

    @Test
    public void testDemandForecastEndpoint() throws Exception {
        List<Map<String, Object>> mockForecast = new ArrayList<>();
        Map<String, Object> entry = new HashMap<>();
        entry.put("productId", 1);
        entry.put("productName", "Test Product");
        entry.put("sku", "TP-001");
        entry.put("availableStock", 10);
        entry.put("demandScore", 50L);
        entry.put("trend", "UP");
        entry.put("lowStockAlert", false);
        entry.put("category", "General");
        mockForecast.add(entry);
        when(demandForecastService.getTopDemandedProducts(anyInt())).thenReturn(mockForecast);

        mockMvc.perform(get("/api/v1/ai/demand-forecast")
                        .header("Authorization", adminToken)
                        .param("topN", "1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].productId").value(1));
    }

    @Test
    public void testDynamicPricingEndpoint() throws Exception {
        Map<String, Object> mockPricing = new HashMap<>();
        mockPricing.put("surgeLevel", "NORMAL");
        mockPricing.put("deliverySurgeMultiplier", 1.0);
        mockPricing.put("platformFeeMultiplier", 1.0);
        mockPricing.put("activeOrders", 5);
        mockPricing.put("isPeakHour", false);
        mockPricing.put("surgeDescription", "No surge");
        when(dynamicPricingService.computeSurgePricing()).thenReturn(mockPricing);

        mockMvc.perform(get("/api/v1/ai/dynamic-pricing")
                        .header("Authorization", adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.surgeLevel").value("NORMAL"));
    }

    @Test
    public void testBundleSuggestionsEndpoint() throws Exception {
        List<Map<String, String>> suggestions = new ArrayList<>();
        Map<String, String> s = new HashMap<>();
        s.put("name", "Basic Bundle");
        s.put("reason", "Popular combo");
        suggestions.add(s);
        when(bundleSuggestionService.getSuggestionsForServiceType(anyString())).thenReturn(suggestions);
        when(bundleSuggestionService.getAvailableServiceTypes()).thenReturn(List.of("NEARBY_AUTO", "STORE_ROUTED"));

        mockMvc.perform(get("/api/v1/ai/bundle-suggestions")
                        .header("Authorization", adminToken)
                        .param("serviceType", "NEARBY_AUTO")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serviceType").value("NEARBY_AUTO"))
                .andExpect(jsonPath("$.suggestions[0].name").value("Basic Bundle"));
    }
}

