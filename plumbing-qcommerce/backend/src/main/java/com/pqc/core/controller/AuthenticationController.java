package com.pqc.core.controller;

import com.pqc.core.entity.User;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import com.pqc.core.security.TokenRevocationService;
import com.pqc.core.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Missing or invalid Authorization header");
        }

        String jwt = authHeader.substring(7);
        try {
            String jti = jwtService.extractJti(jwt);
            Date expiration = jwtService.extractExpiration(jwt);
            String email = jwtService.extractEmail(jwt);

            Long userId = null;
            if (email != null) {
                userId = userRepository.findByEmail(email).map(User::getId).orElse(null);
            }

            // 1. Revoke the presented access token in PostgreSQL
            if (jti != null) {
                tokenRevocationService.revokeToken(jti, userId, expiration, "User logout");
                log.info("Token JTI [{}] has been revoked successfully in PostgreSQL.", jti);
            }

            // 2. Revoke the user's refresh session in PostgreSQL so no new access tokens can be minted
            if (userId != null) {
                refreshTokenService.revokeByUser(userId);
                log.info("Refresh token session for user ID [{}] has been revoked.", userId);
            }
            
            return ResponseEntity.ok("Logged out successfully");
            
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Logout failed");
        }
    }
}
