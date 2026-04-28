package com.pqc.core.controller;

import com.pqc.core.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Missing or invalid Authorization header");
        }

        String jwt = authHeader.substring(7);
        try {
            String jti = jwtService.extractJti(jwt);
            
            // Store JTI in Redis with a 24-hour TTL (matching our max token life)
            // In a more precise system, we'd calculate the remaining time until expiry.
            redisTemplate.opsForValue().set("blacklist:" + jti, "revoked", 24, TimeUnit.HOURS);
            
            log.info("Token JTI: {} has been blacklisted successfully.", jti);
            return ResponseEntity.ok("Logged out successfully");
            
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Logout failed");
        }
    }
}
