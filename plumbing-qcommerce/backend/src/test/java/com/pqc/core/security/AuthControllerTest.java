package com.pqc.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.RefreshTokenRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

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
    }

    @Test
    void register_validRequest_returns201WithCustomerRole() throws Exception {
        Map<String, String> body = Map.of(
                "email", "newuser@example.com",
                "password", "SecurePass123!",
                "confirmPassword", "SecurePass123!",
                "fullName", "New User",
                "phone", "9876543210",
                "role", "ADMIN"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.fullName").value("New User"))
                .andExpect(jsonPath("$.phone").value("9876543210"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.phoneVerified").value(false))
                .andExpect(jsonPath("$.profileComplete").value(true))
                .andExpect(jsonPath("$.authProvider").value("LOCAL"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));

        assertThat(userRepository.findByEmail("newuser@example.com")).isPresent();
        assertThat(userRepository.findByEmail("newuser@example.com").get().getRole())
                .isEqualTo(Role.CUSTOMER);
    }

    @Test
    void register_duplicateEmail_returns409Conflict() throws Exception {
        userRepository.save(User.builder()
                .email("existing@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Existing User")
                .phone("9111111111")
                .role(Role.CUSTOMER)
                .build());

        Map<String, String> body = Map.of(
                "email", "existing@example.com",
                "password", "AnotherPass123!",
                "confirmPassword", "AnotherPass123!",
                "fullName", "Duplicate User",
                "phone", "9222222222"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void register_missingEmail_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "password", "Password123!",
                "confirmPassword", "Password123!",
                "fullName", "No Email User",
                "phone", "9333333333"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("email is required"));
    }

    @Test
    void register_missingPassword_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "email", "nopassword@example.com",
                "fullName", "No Password User",
                "confirmPassword", "Password123!",
                "phone", "9444444444"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("password is required"));
    }

    @Test
    void register_roleInjectionAttempt_roleAlwaysCustomer() throws Exception {
        Map<String, String> body = Map.of(
                "email", "hacker@example.com",
                "password", "Password123!",
                "confirmPassword", "Password123!",
                "fullName", "Hacker User",
                "phone", "9555555555",
                "role", "ADMIN"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void register_duplicatePhone_returns409Conflict() throws Exception {
        userRepository.save(User.builder()
                .email("existing-phone@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Existing Phone User")
                .phone("9666666666")
                .role(Role.CUSTOMER)
                .build());

        Map<String, String> body = Map.of(
                "email", "another@example.com",
                "password", "Password123!",
                "confirmPassword", "Password123!",
                "fullName", "Another User",
                "phone", "9666666666"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Phone already registered"));
    }

    @Test
    void register_passwordMismatch_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "email", "mismatch@example.com",
                "password", "Password123!",
                "confirmPassword", "Password1234!",
                "fullName", "Mismatch User",
                "phone", "9777777777"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("confirmPassword must match password"));
    }

    @Test
    void register_weakPassword_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "email", "weak@example.com",
                "password", "short",
                "confirmPassword", "short",
                "fullName", "Weak Password User",
                "phone", "9888888888"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password must be at least 8 characters"));
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        Map<String, String> body = Map.of(
                "email", "not-an-email",
                "password", "Password123!",
                "confirmPassword", "Password123!",
                "fullName", "Invalid Email User",
                "phone", "9899999999"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email address"));
    }

    @Test
    void login_validCredentials_returnsJwtAndRefreshToken() throws Exception {
        userRepository.save(User.builder()
                .email("login@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Login User")
                .phone("9111111111")
                .role(Role.CUSTOMER)
                .build());

        Map<String, String> request = Map.of(
                "email", "login@example.com",
                "password", "Password123!"
        );

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.email").value("login@example.com"))
                .andExpect(jsonPath("$.fullName").value("Login User"))
                .andExpect(jsonPath("$.phone").value("9111111111"))
                .andExpect(jsonPath("$.user.email").value("login@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        userRepository.save(User.builder()
                .email("wrongpass@example.com")
                .password(passwordEncoder.encode("CorrectPassword!"))
                .fullName("Wrong Pass User")
                .phone("9222222222")
                .role(Role.CUSTOMER)
                .build());

        Map<String, String> request = Map.of(
                "email", "wrongpass@example.com",
                "password", "WrongPassword!"
        );

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_nonExistentUser_returns401WithSameError() throws Exception {
        Map<String, String> request = Map.of(
                "email", "ghost@example.com",
                "password", "Password123!"
        );

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_missingCredentials_returns400() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("email and password are required"));
    }

    @Test
    void login_inactiveUser_returns401() throws Exception {
        userRepository.save(User.builder()
                .email("inactive@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Inactive User")
                .phone("9333333333")
                .role(Role.CUSTOMER)
                .status(UserStatus.SUSPENDED)
                .build());

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "inactive@example.com",
                                "password", "Password123!"
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Account is suspended. Please contact support."));
    }

    @Test
    void register_userCanLoginAfterRegistration() throws Exception {
        Map<String, String> body = Map.of(
                "email", "roundtrip@example.com",
                "password", "Password123!",
                "confirmPassword", "Password123!",
                "fullName", "Round Trip User",
                "phone", "9444444444"
        );

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "roundtrip@example.com",
                                "password", "Password123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("roundtrip@example.com"));
    }

    @Test
    void refresh_validToken_returnsNewTokenPair() throws Exception {
        userRepository.save(User.builder()
                .email("refresh@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Refresh User")
                .phone("9555555555")
                .role(Role.CUSTOMER)
                .build());

        MvcResult loginResult = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "refresh@example.com",
                                "password", "Password123!"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> loginBody = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(), Map.class);
        String refreshToken = (String) loginBody.get("refreshToken");

        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists());
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", "invalid-token-xyz"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_missingToken_returns400() throws Exception {
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Missing refresh token"));
    }
}
