package com.pqc.core.controller;

import com.pqc.core.dto.OtpRequest;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.RefreshTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class OtpController {

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    private static final String REDIS_OTP_KEY_PREFIX = "otp:";
    private final Random random = new Random();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpRequest request) {
        String phone = request.getPhone();
        
        // Generate a 6-digit OTP
        String otp;
        if (phone.equals("+91 9999999999") || phone.equals("+91 9876543210")) {
            otp = "123456"; // Static code for testing
        } else {
            otp = String.format("%06d", random.nextInt(1000000));
        }

        // Save to Redis with 5-minute TTL
        String redisKey = REDIS_OTP_KEY_PREFIX + phone;
        redisTemplate.opsForValue().set(redisKey, otp, 5, TimeUnit.MINUTES);

        log.info("[OTP SERVICE] Generated OTP for phone {}: {}", phone, otp);
        System.out.println("[OTP SERVICE] Generated OTP for phone " + phone + ": " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpRequest request) {
        String phone = request.getPhone();
        String code = request.getCode();

        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP code is required"));
        }

        String redisKey = REDIS_OTP_KEY_PREFIX + phone;
        String cachedOtp = redisTemplate.opsForValue().get(redisKey);

        if (cachedOtp == null || !cachedOtp.equals(code)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired OTP"));
        }

        // OTP is correct, consume it
        redisTemplate.delete(redisKey);

        // Find or register user
        User user = userRepository.findByPhone(phone).orElse(null);
        if (user == null) {
            log.info("Registering new customer for phone number: {}", phone);
            // Sanitize phone digits for fallback email
            String phoneDigits = phone.replaceAll("[^0-9]", "");
            String email = phoneDigits + "@plumbcommerce.com";
            
            // Handle edge case where email already registered but phone was different
            if (userRepository.findByEmail(email).isPresent()) {
                email = phoneDigits + "_" + System.currentTimeMillis() + "@plumbcommerce.com";
            }

            user = User.builder()
                    .phone(phone)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Random secure password
                    .fullName("Customer " + phoneDigits.substring(Math.max(0, phoneDigits.length() - 4)))
                    .role(Role.CUSTOMER)
                    .build();
            user = userRepository.save(user);
        }

        // Issue tokens
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        com.pqc.core.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "refreshToken", refreshToken.getToken(),
                "userId", user.getId(),
                "role", user.getRole().name(),
                "email", user.getEmail()
        ));
    }
}
