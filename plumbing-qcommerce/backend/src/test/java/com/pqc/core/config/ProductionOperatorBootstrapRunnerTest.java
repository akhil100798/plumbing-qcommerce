package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductionOperatorBootstrapRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ProductionOperatorBootstrapProperties properties;
    private ProductionOperatorBootstrapRunner runner;

    @BeforeEach
    void setUp() {
        properties = new ProductionOperatorBootstrapProperties();
        runner = new ProductionOperatorBootstrapRunner(userRepository, passwordEncoder, properties);
    }

    @Test
    @DisplayName("Disabled by default: no user queried or saved")
    void testDisabledByDefault() {
        properties.setEnabled(false);
        runner.run();

        verifyNoInteractions(userRepository);
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Enabled with valid config: provisions single operator with encoded password")
    void testEnabledWithValidConfig() {
        properties.setEnabled(true);
        properties.setEmail("operator@fixkart.com");
        properties.setPassword("SecureBootstrapPass123!");
        properties.setName("Ops Admin");
        properties.setRole("ADMIN");

        when(userRepository.findByEmail("operator@fixkart.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("SecureBootstrapPass123!")).thenReturn("encoded_pass_hash");

        runner.run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User created = captor.getValue();
        assertEquals("operator@fixkart.com", created.getEmail());
        assertEquals("Ops Admin", created.getFullName());
        assertEquals("encoded_pass_hash", created.getPassword());
        assertEquals(Role.ADMIN, created.getRole());
        assertEquals(UserStatus.ACTIVE, created.getStatus());
        assertTrue(created.getProfileComplete());
        assertTrue(created.getPhoneVerified());
    }

    @Test
    @DisplayName("Idempotent: if operator already exists, do not mutate password or save user")
    void testIdempotentExistingUser() {
        properties.setEnabled(true);
        properties.setEmail("existing@fixkart.com");
        properties.setPassword("NewPassword!");

        User existing = User.builder()
                .id(100L)
                .email("existing@fixkart.com")
                .password("original_hash")
                .role(Role.ADMIN)
                .build();

        when(userRepository.findByEmail("existing@fixkart.com")).thenReturn(Optional.of(existing));

        runner.run();

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Missing password: fails closed without saving user")
    void testMissingPasswordFailsClosed() {
        properties.setEnabled(true);
        properties.setEmail("admin@fixkart.com");
        properties.setPassword("");

        runner.run();

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Missing email: fails closed without saving user")
    void testMissingEmailFailsClosed() {
        properties.setEnabled(true);
        properties.setEmail("");
        properties.setPassword("ValidPassword123!");

        runner.run();

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Invalid role string: fails closed without saving user")
    void testInvalidRoleFailsClosed() {
        properties.setEnabled(true);
        properties.setEmail("admin@fixkart.com");
        properties.setPassword("ValidPassword123!");
        properties.setRole("NON_EXISTENT_ROLE");

        when(userRepository.findByEmail("admin@fixkart.com")).thenReturn(Optional.empty());

        runner.run();

        verify(userRepository, never()).save(any());
    }
}
