package com.pqc.core.security;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
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
class AdminRbacControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    private User superAdmin;
    private User admin;
    private User customer;
    private User plumber;
    private User storeManager;
    private User target;

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

        superAdmin = saveUser("super@example.com", Role.SUPER_ADMIN);
        admin = saveUser("admin@example.com", Role.ADMIN);
        customer = saveUser("customer@example.com", Role.CUSTOMER);
        plumber = saveUser("plumber@example.com", Role.PLUMBER);
        storeManager = saveUser("store@example.com", Role.STORE_MANAGER);
        target = saveUser("target@example.com", Role.CUSTOMER);
    }

    @Test
    void superAdminCanAccessRoles() throws Exception {
        mvc.perform(get("/api/v1/admin/rbac/roles")
                .header("Authorization", bearer(superAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0]").value("SUPER_ADMIN"));
    }

    @Test
    void adminCanAccessRoles() throws Exception {
        mvc.perform(get("/api/v1/admin/rbac/roles")
                .header("Authorization", bearer(admin)))
            .andExpect(status().isOk());
    }

    @Test
    void customerCannotAccessRoles() throws Exception {
        mvc.perform(get("/api/v1/admin/rbac/roles")
                .header("Authorization", bearer(customer)))
            .andExpect(status().isForbidden());
    }

    @Test
    void plumberCannotAccessRoles() throws Exception {
        mvc.perform(get("/api/v1/admin/rbac/roles")
                .header("Authorization", bearer(plumber)))
            .andExpect(status().isForbidden());
    }

    @Test
    void storeManagerCannotAccessRoleManagementEndpoint() throws Exception {
        mvc.perform(post("/api/v1/admin/rbac/users/{userId}/role", target.getId())
                .header("Authorization", bearer(storeManager))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"OPERATIONS_ADMIN\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void superAdminCanAssignSuperAdmin() throws Exception {
        mvc.perform(post("/api/v1/admin/rbac/users/{userId}/role", target.getId())
                .header("Authorization", bearer(superAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"SUPER_ADMIN\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("SUPER_ADMIN"));
    }

    @Test
    void adminCannotAssignSuperAdmin() throws Exception {
        mvc.perform(post("/api/v1/admin/rbac/users/{userId}/role", target.getId())
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"SUPER_ADMIN\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCanAssignOperationsAdmin() throws Exception {
        mvc.perform(post("/api/v1/admin/rbac/users/{userId}/role", target.getId())
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"OPERATIONS_ADMIN\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("OPERATIONS_ADMIN"));
    }

    @Test
    void meReturnsCurrentRoleAndPermissions() throws Exception {
        mvc.perform(get("/api/v1/admin/rbac/me")
                .header("Authorization", bearer(storeManager)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("STORE_MANAGER"))
            .andExpect(jsonPath("$.permissions").isArray());
    }

    private User saveUser(String email, Role role) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123!"))
                .fullName(role.name())
                .phone(email.hashCode() + "")
                .role(role)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name());
    }
}
