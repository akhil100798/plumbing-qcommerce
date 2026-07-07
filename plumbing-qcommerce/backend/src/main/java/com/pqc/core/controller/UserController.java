package com.pqc.core.controller;

import com.pqc.core.entity.User;
import com.pqc.core.service.UserService;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUser currentUser;
    private final com.pqc.core.repository.PlumberKycRepository plumberKycRepository;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getCurrentUser() {
        User user = currentUser.require();
        if (user.getRole() == com.pqc.core.entity.Role.PLUMBER) {
            plumberKycRepository.findByPlumberId(user.getId()).ifPresent(kyc -> {
                user.setAvailability(kyc.getAvailabilityStatus() == com.pqc.core.entity.PlumberAvailabilityStatus.ONLINE);
            });
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/me/availability")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<User> updateAvailability(@RequestBody AvailabilityRequest request) {
        User user = currentUser.require();
        com.pqc.core.entity.PlumberKyc kyc = plumberKycRepository.findByPlumberId(user.getId())
                .orElseGet(() -> com.pqc.core.entity.PlumberKyc.builder()
                        .plumberId(user.getId())
                        .status(com.pqc.core.entity.PlumberKycStatus.APPROVED)
                        .build());
        kyc.setAvailabilityStatus(request.availability()
                ? com.pqc.core.entity.PlumberAvailabilityStatus.ONLINE
                : com.pqc.core.entity.PlumberAvailabilityStatus.OFFLINE);
        plumberKycRepository.save(kyc);
        user.setAvailability(request.availability());
        return ResponseEntity.ok(user);
    }

    public record AvailabilityRequest(boolean availability) {}

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @GetMapping("/{email}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
