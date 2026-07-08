package com.pqc.core.controller;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import com.pqc.core.dto.GoogleCustomerAuthRequest;
import com.pqc.core.dto.GoogleCustomerAuthResponse;
import com.pqc.core.service.GoogleTokenVerifierService;
import com.pqc.core.repository.UserAddressRepository;

import java.util.Map;

/**
 * AuthController — handles public registration, login, token refresh,
 * and admin-only user seeding (BUG-06 fix).
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.pqc.core.service.RefreshTokenService refreshTokenService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final UserAddressRepository userAddressRepository;

    /**
     * POST /api/v1/auth/register
     * Public registration — role is always forced to CUSTOMER for security.
     * BUG-06 note: privileged roles (ADMIN, PLUMBER, STORE_MANAGER) must use
     * POST /api/v1/admin/seed-user (admin-authenticated).
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        // BUG-08 fix: validate required fields
        String email    = body.get("email");
        String password = body.get("password");
        String fullName = body.get("fullName");
        String phone    = body.get("phone");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email is required"));
        }
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "password is required"));
        }
        if (fullName == null || fullName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "fullName is required"));
        }
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "phone is required"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .phone(phone)
                .role(Role.CUSTOMER)   // Always CUSTOMER — security enforcement
                .build();

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id",       saved.getId(),
                "email",    saved.getEmail(),
                "fullName", saved.getFullName(),
                "role",     saved.getRole().name()
        ));
    }

    /**
     * POST /api/v1/auth/login
     * Issues a JWT access token + refresh token for valid credentials.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email    = request.get("email");
        String password = request.get("password");

        // BUG-08 fix: validate before attempting auth
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email and password are required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            // Oracle prevention: same error for non-existent user and wrong password
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Account is " + user.getStatus().name().toLowerCase() + ". Please contact support."));
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        com.pqc.core.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return ResponseEntity.ok(Map.of(
                "token",        token,
                "refreshToken", refreshToken.getToken(),
                "userId",       user.getId(),
                "role",         user.getRole().name(),
                "email",        user.getEmail()
        ));
    }

    /**
     * POST /api/v1/auth/refresh
     * Rotates a refresh token and issues a new access token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshTokenStr = request.get("refreshToken");
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing refresh token"));
        }

        try {
            com.pqc.core.entity.RefreshToken rotatedToken = refreshTokenService.rotateToken(refreshTokenStr);
            User user = rotatedToken.getUser();
            String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(Map.of(
                    "token",        accessToken,
                    "refreshToken", rotatedToken.getToken()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v1/auth/google/customer
     * Public endpoint for customer Google signup/login.
     */
    @PostMapping("/google/customer")
    public ResponseEntity<?> googleCustomerAuth(@RequestBody GoogleCustomerAuthRequest request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "idToken is required"));
        }

        try {
            GoogleTokenVerifierService.GoogleClaims claims = googleTokenVerifierService.verifyToken(request.getIdToken());
            
            // Find existing user by providerId (Google sub)
            User user = userRepository.findAll().stream()
                    .filter(u -> claims.sub().equals(u.getProviderId()))
                    .findFirst()
                    .orElse(null);

            if (user == null) {
                // If not found by providerId, check by email
                User existingUserByEmail = userRepository.findByEmail(claims.email()).orElse(null);
                if (existingUserByEmail != null) {
                    // Check if existing user has privileged role
                    if (existingUserByEmail.getRole() != Role.CUSTOMER) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Google authentication is only allowed for CUSTOMER role"));
                    }
                    
                    // Link Google provider to existing CUSTOMER user
                    user = existingUserByEmail;
                    user.setAuthProvider("GOOGLE");
                    user.setProviderId(claims.sub());
                    if (user.getProfileImageUrl() == null) {
                        user.setProfileImageUrl(claims.picture());
                    }
                    
                    // Determine if profile complete
                    boolean hasAddress = !userAddressRepository.findByUserId(user.getId()).isEmpty();
                    boolean complete = user.getFullName() != null && !user.getFullName().isBlank() 
                            && user.getPhone() != null && !user.getPhone().isBlank() && hasAddress;
                    user.setProfileComplete(complete);
                    
                    user = userRepository.save(user);
                } else {
                    // Create new CUSTOMER user
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
                // User exists with providerId. Check if they have address and phone completed.
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
                        .body(Map.of("error", "Account is " + user.getStatus().name().toLowerCase() + ". Please contact support."));
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
}
