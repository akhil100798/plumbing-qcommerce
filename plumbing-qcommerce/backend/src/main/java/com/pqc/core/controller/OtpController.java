package com.pqc.core.controller;

import com.pqc.core.dto.OtpRequest;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.OtpService;
import com.pqc.core.service.RefreshTokenService;
import com.pqc.core.util.PhoneMaskingUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class OtpController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpRequest request) {
        String phone = request.getPhone();
        otpService.sendOtp(phone);
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpRequest request) {
        String phone = request.getPhone();
        String code = request.getCode();

        // Performs secure validation, lockout check, demo bypass and consumption logic inside the service
        otpService.verifyOtp(phone, code);

        // Find or register user
        User user = userRepository.findByPhone(phone).orElse(null);
        if (user == null) {
            log.info("Registering new customer for phone number: {}", PhoneMaskingUtil.mask(phone));
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
