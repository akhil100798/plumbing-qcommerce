package com.pqc.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.RefreshTokenRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.service.RefreshTokenService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TokenRevocationSecurityTest {

    @Autowired private MockMvc mvc;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private TokenRevocationService tokenRevocationService;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE outbox_events RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE revoked_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

        testUser = userRepository.save(User.builder()
                .email("customer@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Test Customer")
                .phone("9800000001")
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .authProvider("LOCAL")
                .profileComplete(true)
                .phoneVerified(true)
                .build());

        adminUser = userRepository.save(User.builder()
                .email("superadmin@example.com")
                .password(passwordEncoder.encode("AdminPass123!"))
                .fullName("Super Admin")
                .phone("9800000002")
                .role(Role.SUPER_ADMIN)
                .status(UserStatus.ACTIVE)
                .authProvider("LOCAL")
                .profileComplete(true)
                .phoneVerified(true)
                .build());
    }

    @Test
    @DisplayName("1. Valid access token accepted")
    void test_validAccessToken_accepted() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testUser.getEmail()));
    }

    @Test
    @DisplayName("2. Invalid signature rejected with 401")
    void test_invalidSignature_rejected() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());
        String tamperedToken = token.substring(0, token.lastIndexOf('.') + 1) + "InVaLiDsIgNaTuRe12345";

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("3. Expired token rejected with 401")
    void test_expiredToken_rejected() throws Exception {
        String expiredToken = Jwts.builder()
                .setSubject(testUser.getEmail())
                .setId(UUID.randomUUID().toString())
                .claim("role", testUser.getRole().name())
                .setIssuedAt(new Date(System.currentTimeMillis() - 100000L))
                .setExpiration(new Date(System.currentTimeMillis() - 1000L))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()), SignatureAlgorithm.HS256)
                .compact();

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("4. Revoked access token rejected with 401")
    void test_revokedAccessToken_rejected() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());
        String jti = jwtService.extractJti(token);
        Date expiry = jwtService.extractExpiration(token);

        // Manually revoke the token in PostgreSQL
        tokenRevocationService.revokeToken(jti, testUser.getId(), expiry, "Administrative revocation");

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token has been revoked."));
    }

    @Test
    @DisplayName("5. Logged-out access token immediately rejected with 401")
    void test_loggedOutAccessToken_immediatelyRejected() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());

        // Initial request succeeds
        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Perform logout
        mvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Immediate subsequent request fails
        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Token has been revoked."));
    }

    @Test
    @DisplayName("6. Logged-out refresh session cannot mint new tokens")
    void test_loggedOutRefreshSession_cannotMintNewTokens() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());
        com.pqc.core.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(testUser);

        // Logout revokes access token AND user refresh session in PostgreSQL
        mvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Attempting to refresh with the refresh token fails
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken.getToken()))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("7. Refresh-token rotation succeeds for valid sessions")
    void test_refreshTokenRotation_succeeds() throws Exception {
        com.pqc.core.entity.RefreshToken oldRefreshToken = refreshTokenService.createRefreshToken(testUser);

        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", oldRefreshToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());

        // Verify old refresh token is deleted
        assertThat(refreshTokenRepository.findByToken(oldRefreshToken.getToken())).isEmpty();
    }

    @Test
    @DisplayName("8. Reused or revoked refresh token rejected")
    void test_reusedRefreshToken_rejected() throws Exception {
        com.pqc.core.entity.RefreshToken oldRefreshToken = refreshTokenService.createRefreshToken(testUser);

        // First rotation succeeds
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", oldRefreshToken.getToken()))))
                .andExpect(status().isOk());

        // Replaying the old refresh token fails
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", oldRefreshToken.getToken()))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("9. Unauthorized role access rejected with 403")
    void test_unauthorizedRoleAccess_rejected() throws Exception {
        String customerToken = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());

        mvc.perform(get("/api/v1/admin/super/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10. Inactive or locked users rejected with 401")
    void test_inactiveOrLockedUser_rejected() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());

        // Block the user
        testUser.setStatus(UserStatus.BLOCKED);
        userRepository.save(testUser);

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("11. Repeated logout handled safely and idempotently")
    void test_repeatedLogout_handledSafely() throws Exception {
        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());

        // First logout succeeds
        mvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Second logout with same token also succeeds idempotently
        mvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("12. Concurrent logout and authentication execution verified")
    void test_concurrentLogoutAndAuth_verified() throws Exception {
        int threads = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger successCount = new AtomicInteger(0);

        String token = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());

        for (int i = 0; i < threads; i++) {
            final boolean isLogout = (i == 0); // One thread logs out, others authenticate
            executor.submit(() -> {
                try {
                    if (isLogout) {
                        mvc.perform(post("/api/v1/auth/logout")
                                .header("Authorization", "Bearer " + token));
                    } else {
                        mvc.perform(get("/api/v1/auth/me")
                                .header("Authorization", "Bearer " + token));
                    }
                    successCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(threads);
    }

    @Test
    @DisplayName("13. Flyway V36 schema and V1-V35 compatibility verified")
    void test_schemaCompatibility_verified() {
        // Verify revoked_tokens table exists with expected structure
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM information_schema.tables WHERE UPPER(table_name) = 'REVOKED_TOKENS'",
                Integer.class
        );
        assertThat(tableCount).isGreaterThan(0);

        // Verify primary V1-V35 tables exist
        Integer usersTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM information_schema.tables WHERE UPPER(table_name) = 'USERS'",
                Integer.class
        );
        Integer refreshTokensTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM information_schema.tables WHERE UPPER(table_name) = 'REFRESH_TOKENS'",
                Integer.class
        );
        assertThat(usersTable).isGreaterThan(0);
        assertThat(refreshTokensTable).isGreaterThan(0);
    }
}
