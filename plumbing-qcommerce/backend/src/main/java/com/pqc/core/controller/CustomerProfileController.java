package com.pqc.core.controller;

import com.pqc.core.dto.CustomerProfileCompletionRequest;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserAddress;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.repository.UserAddressRepository;
import com.pqc.core.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerProfileController {

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final CurrentUser currentUser;

    /**
     * PUT /api/v1/customers/me/profile-completion
     * Completes profile and creates a default address for the CUSTOMER.
     */
    @PutMapping("/me/profile-completion")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> completeProfile(@Valid @RequestBody CustomerProfileCompletionRequest request) {
        User user = currentUser.require();

        // Update profile fields
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setProfileComplete(true);

        User savedUser = userRepository.save(user);

        // Create Default Home Address
        String fullAddressLine = request.getAddressLine1();
        if (request.getLandmark() != null && !request.getLandmark().isBlank()) {
            fullAddressLine += ", Landmark: " + request.getLandmark();
        }
        fullAddressLine += ", " + request.getCity() + ", " + request.getState() + " - " + request.getPincode();

        UserAddress address = UserAddress.builder()
                .label("Home")
                .name(request.getFullName())
                .phone(request.getPhone())
                .addressLine(fullAddressLine)
                .user(savedUser)
                .build();

        userAddressRepository.save(address);

        log.info("Profile completed and default Home address added for customer: {}", savedUser.getEmail());

        return ResponseEntity.ok(savedUser);
    }
}
