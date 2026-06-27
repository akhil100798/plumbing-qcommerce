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
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SuperAdminControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    private User superAdmin;
    private User admin;
    private User customer;

    @BeforeEach
    void setUp() {
        truncateTables();
        superAdmin = saveUser("super@example.com", Role.SUPER_ADMIN);
        admin = saveUser("admin@example.com", Role.ADMIN);
        customer = saveUser("customer@example.com", Role.CUSTOMER);
    }

    @Test
    void superAdminCanAccessDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/super/dashboard")
                        .header("Authorization", bearer(superAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCustomers").value(1));
    }

    @Test
    void adminCanAccessDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/super/dashboard")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void superAdminCanListUsers() throws Exception {
        mvc.perform(get("/api/v1/admin/super/users")
                        .header("Authorization", bearer(superAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void superAdminCanSuspendNormalUser() throws Exception {
        mvc.perform(patch("/api/v1/admin/super/users/{id}/status", customer.getId())
                        .header("Authorization", bearer(superAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
    }

    @Test
    void adminCannotSuspendSuperAdmin() throws Exception {
        mvc.perform(patch("/api/v1/admin/super/users/{id}/status", superAdmin.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void userCannotSuspendThemselves() throws Exception {
        mvc.perform(patch("/api/v1/admin/super/users/{id}/status", superAdmin.getId())
                        .header("Authorization", bearer(superAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isForbidden());
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

    private void truncateTables() {
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
    }
}
