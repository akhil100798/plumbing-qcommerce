package com.pqc.core.security;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserAddressRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.service.GoogleTokenVerifierService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GoogleCustomerAuthTest {

    @Autowired private MockMvc mvc;
    @Autowired private UserRepository userRepository;
    @Autowired private UserAddressRepository userAddressRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private GoogleTokenVerifierService googleTokenVerifierService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE user_addresses RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name());
    }

    @Test
    void googleAuth_newUser_createsCustomer() throws Exception {
        GoogleTokenVerifierService.GoogleClaims mockClaims = new GoogleTokenVerifierService.GoogleClaims(
                "google-sub-123",
                "newcustomer@gmail.com",
                true,
                "John Doe",
                "http://example.com/picture.jpg"
        );
        Mockito.when(googleTokenVerifierService.verifyToken("mock-valid-token")).thenReturn(mockClaims);

        Map<String, String> request = Map.of("idToken", "mock-valid-token");

        mvc.perform(post("/api/v1/auth/google/customer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value("newcustomer@gmail.com"))
                .andExpect(jsonPath("$.user.fullName").value("John Doe"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.authProvider").value("GOOGLE"))
                .andExpect(jsonPath("$.user.profileComplete").value(false));

        User saved = userRepository.findByEmail("newcustomer@gmail.com").orElse(null);
        assertThat(saved).isNotNull();
        assertThat(saved.getProviderId()).isEqualTo("google-sub-123");
        assertThat(saved.getAuthProvider()).isEqualTo("GOOGLE");
    }

    @Test
    void googleAuth_existingCustomer_logsIn() throws Exception {
        User user = User.builder()
                .email("john@gmail.com")
                .fullName("John Existing")
                .role(Role.CUSTOMER)
                .authProvider("GOOGLE")
                .providerId("google-sub-123")
                .status(UserStatus.ACTIVE)
                .profileComplete(false)
                .build();
        userRepository.save(user);

        GoogleTokenVerifierService.GoogleClaims mockClaims = new GoogleTokenVerifierService.GoogleClaims(
                "google-sub-123",
                "john@gmail.com",
                true,
                "John Existing Updated",
                "http://example.com/pic.jpg"
        );
        Mockito.when(googleTokenVerifierService.verifyToken("mock-token")).thenReturn(mockClaims);

        Map<String, String> request = Map.of("idToken", "mock-token");

        mvc.perform(post("/api/v1/auth/google/customer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value("john@gmail.com"));
    }

    @Test
    void googleAuth_existingLocalCustomer_linksAccount() throws Exception {
        User user = User.builder()
                .email("local@gmail.com")
                .fullName("Local Customer")
                .role(Role.CUSTOMER)
                .authProvider("LOCAL")
                .status(UserStatus.ACTIVE)
                .phone("9999999999")
                .build();
        userRepository.save(user);

        GoogleTokenVerifierService.GoogleClaims mockClaims = new GoogleTokenVerifierService.GoogleClaims(
                "google-sub-local",
                "local@gmail.com",
                true,
                "Local Customer",
                "pic"
        );
        Mockito.when(googleTokenVerifierService.verifyToken("mock-token")).thenReturn(mockClaims);

        Map<String, String> request = Map.of("idToken", "mock-token");

        mvc.perform(post("/api/v1/auth/google/customer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.authProvider").value("GOOGLE"));

        User updated = userRepository.findByEmail("local@gmail.com").orElse(null);
        assertThat(updated).isNotNull();
        assertThat(updated.getAuthProvider()).isEqualTo("GOOGLE");
        assertThat(updated.getProviderId()).isEqualTo("google-sub-local");
    }

    @Test
    void googleAuth_existingPrivilegedUser_forbidden() throws Exception {
        User admin = User.builder()
                .email("admin@plumbcommerce.com")
                .fullName("Admin User")
                .role(Role.ADMIN)
                .password(passwordEncoder.encode("password"))
                .status(UserStatus.ACTIVE)
                .phone("1111111111")
                .build();
        userRepository.save(admin);

        GoogleTokenVerifierService.GoogleClaims mockClaims = new GoogleTokenVerifierService.GoogleClaims(
                "google-sub-admin",
                "admin@plumbcommerce.com",
                true,
                "Admin User",
                "pic"
        );
        Mockito.when(googleTokenVerifierService.verifyToken("mock-token")).thenReturn(mockClaims);

        Map<String, String> request = Map.of("idToken", "mock-token");

        mvc.perform(post("/api/v1/auth/google/customer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void profileCompletion_validRequest_succeeds() throws Exception {
        User user = User.builder()
                .email("profilecheck@gmail.com")
                .fullName("Google Customer")
                .role(Role.CUSTOMER)
                .authProvider("GOOGLE")
                .providerId("google-sub-456")
                .status(UserStatus.ACTIVE)
                .profileComplete(false)
                .build();
        user = userRepository.save(user);

        Map<String, String> request = Map.of(
                "fullName", "Akhil",
                "phone", "9876543210",
                "addressLine1", "100 Green Hills",
                "city", "Hyderabad",
                "state", "Telangana",
                "pincode", "500001",
                "landmark", "Near water tank"
        );

        mvc.perform(put("/api/v1/customers/me/profile-completion")
                        .header("Authorization", bearer(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Akhil"))
                .andExpect(jsonPath("$.phone").value("9876543210"))
                .andExpect(jsonPath("$.profileComplete").value(true));

        User updated = userRepository.findByEmail("profilecheck@gmail.com").orElse(null);
        assertThat(updated).isNotNull();
        assertThat(updated.getProfileComplete()).isTrue();
        assertThat(userAddressRepository.findByUserId(user.getId())).isNotEmpty();
    }

    @Test
    void profileCompletion_invalidPhoneAndPincode_returns400() throws Exception {
        User user = User.builder()
                .email("profilecheck@gmail.com")
                .fullName("Google Customer")
                .role(Role.CUSTOMER)
                .authProvider("GOOGLE")
                .status(UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        Map<String, String> request = Map.of(
                "fullName", "Akhil",
                "phone", "12345",
                "addressLine1", "100 Green Hills",
                "city", "Hyderabad",
                "state", "Telangana",
                "pincode", "abc"
        );

        mvc.perform(put("/api/v1/customers/me/profile-completion")
                        .header("Authorization", bearer(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
