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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SuperAdminSecurityTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    private User customer;
    private User plumber;
    private User storeManager;

    @BeforeEach
    void setUp() {
        truncateTables();
        customer = saveUser("customer@example.com", Role.CUSTOMER, UserStatus.ACTIVE);
        plumber = saveUser("plumber@example.com", Role.PLUMBER, UserStatus.ACTIVE);
        storeManager = saveUser("store@example.com", Role.STORE_MANAGER, UserStatus.ACTIVE);
        saveUser("suspended@example.com", Role.ADMIN, UserStatus.SUSPENDED);
    }

    @Test
    void customerCannotAccessDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/super/dashboard")
                        .header("Authorization", bearer(customer)))
                .andExpect(status().isForbidden());
    }

    @Test
    void plumberCannotAccessDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/super/dashboard")
                        .header("Authorization", bearer(plumber)))
                .andExpect(status().isForbidden());
    }

    @Test
    void storeManagerCannotAccessDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/super/dashboard")
                        .header("Authorization", bearer(storeManager)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestReturnsUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/admin/super/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void suspendedUserCannotLogin() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"suspended@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Account is suspended. Please contact support."));
    }

    private User saveUser(String email, Role role, UserStatus status) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("password"))
                .fullName(role.name() + " User")
                .phone("9" + Math.abs(email.hashCode()))
                .role(role)
                .status(status)
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
