package com.pqc.core.controller;

import com.pqc.core.dto.AuthResponse;
import com.pqc.core.dto.CustomerRegistrationRequest;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.pqc.core.dto.GoogleCustomerAuthRequest;
import com.pqc.core.dto.GoogleCustomerAuthResponse;
import com.pqc.core.service.GoogleTokenVerifierService;
import com.pqc.core.repository.UserAddressRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.pqc.core.service.RefreshTokenService refreshTokenService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final UserAddressRepository userAddressRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody CustomerRegistrationRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(errorBody("confirmPassword must match password"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody("Email already registered"));
        }

        if (userRepository.findByPhone(phone).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody("Phone already registered"));
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(phone)
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .authProvider("LOCAL")
                .phoneVerified(false)
                .profileComplete(true)
                .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getEmail(), saved.getRole().name());
        com.pqc.core.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(saved, token, refreshToken));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(errorBody("email and password are required"));
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody("Invalid credentials"));
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorBody("Account is " + user.getStatus().name().toLowerCase() + ". Please contact support."));
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        com.pqc.core.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return ResponseEntity.ok(AuthResponse.from(user, token, refreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshTokenStr = request.get("refreshToken");
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            return ResponseEntity.badRequest().body(errorBody("Missing refresh token"));
        }

        try {
            com.pqc.core.entity.RefreshToken rotatedToken = refreshTokenService.rotateToken(refreshTokenStr);
            User user = rotatedToken.getUser();
            String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(Map.of(
                    "token", accessToken,
                    "refreshToken", rotatedToken.getToken()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/google/customer")
    public ResponseEntity<?> googleCustomerAuth(@RequestBody GoogleCustomerAuthRequest request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            return ResponseEntity.badRequest().body(errorBody("idToken is required"));
        }

        try {
            GoogleTokenVerifierService.GoogleClaims claims = googleTokenVerifierService.verifyToken(request.getIdToken());

            User user = userRepository.findAll().stream()
                    .filter(u -> claims.sub().equals(u.getProviderId()))
                    .findFirst()
                    .orElse(null);

            if (user == null) {
                User existingUserByEmail = userRepository.findByEmail(claims.email()).orElse(null);
                if (existingUserByEmail != null) {
                    if (existingUserByEmail.getRole() != Role.CUSTOMER) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(errorBody("Google authentication is only allowed for CUSTOMER role"));
                    }

                    user = existingUserByEmail;
                    user.setAuthProvider("GOOGLE");
                    user.setProviderId(claims.sub());
                    if (user.getProfileImageUrl() == null) {
                        user.setProfileImageUrl(claims.picture());
                    }

                    boolean hasAddress = !userAddressRepository.findByUserId(user.getId()).isEmpty();
                    boolean complete = user.getFullName() != null && !user.getFullName().isBlank()
                            && user.getPhone() != null && !user.getPhone().isBlank() && hasAddress;
                    user.setProfileComplete(complete);

                    user = userRepository.save(user);
                } else {
                    user = User.builder()
                            .email(claims.email())
                            .fullName(claims.name() != null ? claims.name() : "Google Customer")
                            .role(Role.CUSTOMER)
                            .authProvider("GOOGLE")
                            .providerId(claims.sub())
                            .profileImageUrl(claims.picture())
                            .status(UserStatus.ACTIVE)
                            .phoneVerified(false)
                            .profileComplete(false)
                            .build();

                    user = userRepository.save(user);
                }
            } else {
                boolean hasAddress = !userAddressRepository.findByUserId(user.getId()).isEmpty();
                boolean complete = user.getFullName() != null && !user.getFullName().isBlank()
                        && user.getPhone() != null && !user.getPhone().isBlank() && hasAddress;
                if (user.getProfileComplete() != complete) {
                    user.setProfileComplete(complete);
                    user = userRepository.save(user);
                }
            }

            if (user.getStatus() != UserStatus.ACTIVE) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(errorBody("Account is " + user.getStatus().name().toLowerCase() + ". Please contact support."));
            }

            String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
            com.pqc.core.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            GoogleCustomerAuthResponse.UserDto userDto = GoogleCustomerAuthResponse.UserDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .phone(user.getPhone())
                    .phoneVerified(user.getPhoneVerified())
                    .profileComplete(user.getProfileComplete())
                    .authProvider(user.getAuthProvider())
                    .profileImageUrl(user.getProfileImageUrl())
                    .build();

            return ResponseEntity.ok(GoogleCustomerAuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .user(userDto)
                    .build());

        } catch (Exception e) {
            log.error("Google authentication failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(e.getMessage()));
        }
    }

    private Map<String, String> errorBody(String message) {
        return Map.of("error", message, "message", message);
    }
}
