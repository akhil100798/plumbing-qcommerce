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
class FinanceAdminSecurityTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    @BeforeEach void setUp() { jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE"); for (String table : new String[]{"refund_requests","settlements","outbox_events","inventory_reservations","product_order_items","product_orders","service_orders","stocks","stores","user_addresses","wallet_transactions","wallets","refresh_tokens","notifications","users"}) jdbcTemplate.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY"); jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE"); }

    @Test
    void disallowedRolesCannotAccessFinanceDashboard() throws Exception {
        for (Role role : new Role[]{Role.OPERATIONS_ADMIN, Role.SUPPORT_ADMIN, Role.MARKETING_ADMIN, Role.CUSTOMER, Role.PLUMBER, Role.STORE_MANAGER, Role.DELIVERY_PARTNER, Role.PLUMBER_MANAGER}) {
            User user = saveUser(role.name().toLowerCase() + "-finance@example.com", role);
            mvc.perform(get("/api/v1/admin/finance/dashboard").header("Authorization", bearer(user))).andExpect(status().isForbidden());
        }
    }

    private User saveUser(String email, Role role) { return userRepository.save(User.builder().email(email).password(passwordEncoder.encode("password")).fullName(role.name() + " User").phone("9" + Math.abs(email.hashCode())).role(role).status(UserStatus.ACTIVE).build()); }
    private String bearer(User user) { return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name()); }
}