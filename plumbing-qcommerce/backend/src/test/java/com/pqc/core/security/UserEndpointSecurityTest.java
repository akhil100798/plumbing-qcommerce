package com.pqc.core.security;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.CategoryRepository;
import com.pqc.core.repository.InventoryReservationRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ProductRepository;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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
class UserEndpointSecurityTest {

    @Autowired private MockMvc mvc;

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private ServiceOrderRepository serviceOrderRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private OutboxEventRepository outboxRepository;
    @Autowired private InventoryReservationRepository reservationRepository;
    @Autowired private ProductOrderRepository productOrderRepository;
    @Autowired private StockRepository stockRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;

    @BeforeEach
    void clearUsers() {
        reservationRepository.deleteAll();
        reservationRepository.flush();
        productOrderRepository.deleteAll();
        productOrderRepository.flush();
        serviceOrderRepository.deleteAll();
        serviceOrderRepository.flush();
        outboxRepository.deleteAll();
        outboxRepository.flush();
        stockRepository.deleteAll();
        stockRepository.flush();
        productRepository.deleteAll();
        productRepository.flush();
        categoryRepository.deleteAll();
        categoryRepository.flush();
        storeRepository.deleteAll();
        storeRepository.flush();
        userRepository.deleteAll();
        userRepository.flush();
    }

    @Test
    void registrationForcesCustomerAndNeverReturnsPassword() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "new@example.com",
                      "password": "Password123!",
                      "fullName": "New User",
                      "phone": "9999999999",
                      "role": "ADMIN"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void anonymousUserEnumerationIsRejected() throws Exception {
        mvc.perform(get("/api/v1/users"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedUserCannotAccessOwnProfile() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCanAccessOwnProfileButNotAdminOnlyUserRoutes() throws Exception {
        User customer = saveUser("customer@example.com", Role.CUSTOMER);

        mvc.perform(get("/api/v1/users/me")
                .header("Authorization", bearer(customer)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(customer.getEmail()))
            .andExpect(jsonPath("$.role").value("CUSTOMER"));

        mvc.perform(get("/api/v1/users")
                .header("Authorization", bearer(customer)))
            .andExpect(status().isForbidden());
    }

    @Test
    void plumberCanAccessOwnProfileButNotAdminOnlyUserRoutes() throws Exception {
        User plumber = saveUser("plumber@example.com", Role.PLUMBER);

        mvc.perform(get("/api/v1/users/me")
                .header("Authorization", bearer(plumber)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(plumber.getEmail()))
            .andExpect(jsonPath("$.role").value("PLUMBER"));

        mvc.perform(get("/api/v1/users")
                .header("Authorization", bearer(plumber)))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCanAccessOwnProfileAndAdminOnlyUserRoutes() throws Exception {
        User admin = saveUser("admin@example.com", Role.ADMIN);

        mvc.perform(get("/api/v1/users/me")
                .header("Authorization", bearer(admin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(admin.getEmail()))
            .andExpect(jsonPath("$.role").value("ADMIN"));

        mvc.perform(get("/api/v1/users")
                .header("Authorization", bearer(admin)))
            .andExpect(status().isOk());
    }

    @Test
    void superAdminCanAccessOwnProfileAndAdminOnlyUserRoutes() throws Exception {
        User superAdmin = saveUser("superadmin@example.com", Role.SUPER_ADMIN);

        mvc.perform(get("/api/v1/users/me")
                .header("Authorization", bearer(superAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(superAdmin.getEmail()))
            .andExpect(jsonPath("$.role").value("SUPER_ADMIN"));

        mvc.perform(get("/api/v1/users")
                .header("Authorization", bearer(superAdmin)))
            .andExpect(status().isOk());
    }

    @Test
    void loginDoesNotRevealWhetherAccountExists() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "known@example.com",
                      "password": "Password123!",
                      "fullName": "Known User",
                      "phone": "9999999999"
                    }
                    """))
            .andExpect(status().isCreated());

        String credentials = "{\"email\":\"%s\",\"password\":\"WrongPassword123!\"}";

        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials.formatted("known@example.com")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));

        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials.formatted("missing@example.com")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    private User saveUser(String email, Role role) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123!"))
                .fullName(role.name())
                .phone("9999999999")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name());
    }
}
