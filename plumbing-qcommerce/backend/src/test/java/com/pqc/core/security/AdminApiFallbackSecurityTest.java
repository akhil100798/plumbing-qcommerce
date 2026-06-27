package com.pqc.core.security;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminApiFallbackSecurityTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String table : new String[]{
                "marketing_notifications", "marketing_banners", "marketing_campaigns", "offers",
                "plumber_kyc", "support_messages", "support_tickets", "refund_requests", "settlements",
                "outbox_events", "inventory_reservations", "product_order_items", "product_orders",
                "service_orders", "stocks", "stores", "user_addresses", "wallet_transactions",
                "wallets", "refresh_tokens", "notifications", "users"
        }) {
            try {
                jdbcTemplate.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY");
            } catch (Exception ignored) {
            }
        }
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    }

    @Test
    void storeManagerCannotAccessGenericAdminMetrics() throws Exception {
        User storeManager = saveUser("store-manager@fallback.test", Role.STORE_MANAGER);

        mvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", bearer(storeManager)))
                .andExpect(status().isForbidden());
    }

    @Test
    void storeManagerStillCanAccessAdminAccessProbe() throws Exception {
        User storeManager = saveUser("store-manager-rbac@fallback.test", Role.STORE_MANAGER);

        mvc.perform(get("/api/v1/admin/rbac/me")
                        .header("Authorization", bearer(storeManager)))
                .andExpect(status().isOk());
    }

    @Test
    void protectedAdminEndpointRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/v1/admin/operations/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void wrongRoleGetsForbiddenForProtectedAdminEndpoint() throws Exception {
        User storeManager = saveUser("store-manager-operations@fallback.test", Role.STORE_MANAGER);

        mvc.perform(get("/api/v1/admin/operations/dashboard")
                        .header("Authorization", bearer(storeManager)))
                .andExpect(status().isForbidden());
    }

    @Test
    void correctRoleGetsSuccessForProtectedAdminEndpoint() throws Exception {
        User operationsAdmin = saveUser("operations-admin@fallback.test", Role.OPERATIONS_ADMIN);

        mvc.perform(get("/api/v1/admin/operations/dashboard")
                        .header("Authorization", bearer(operationsAdmin)))
                .andExpect(status().isOk());
    }

    private User saveUser(String email, Role role) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("password"))
                .fullName(role.name() + " User")
                .phone("9" + Math.abs(email.hashCode()))
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name());
    }
}
