package com.pqc.core.controller;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(adminService.getGlobalMetrics());
    }

    @PostMapping("/seed-user")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> seedUser(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");
        String fullName = body.get("fullName");
        String phone    = body.get("phone");
        String roleStr  = body.get("role");

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "email is required"));
        if (password == null || password.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "password is required"));
        if (fullName == null || fullName.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "fullName is required"));
        if (phone == null || phone.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "phone is required"));

        Role role;
        try {
            role = (roleStr != null && !roleStr.isBlank()) ? Role.valueOf(roleStr.toUpperCase()) : Role.CUSTOMER;
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid role. Valid values: " + Arrays.toString(Role.values())
            ));
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
                .role(role)
                .build();

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id",       saved.getId(),
                "email",    saved.getEmail(),
                "fullName", saved.getFullName(),
                "role",     saved.getRole().name(),
                "message",  "User seeded successfully"
        ));
    }
}

