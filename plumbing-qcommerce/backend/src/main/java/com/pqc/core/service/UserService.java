package com.pqc.core.service;

import com.pqc.core.api.auth.RegisterCustomerRequest;
import com.pqc.core.api.user.UserResponse;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public UserResponse registerCustomer(RegisterCustomerRequest request) {
        User user = User.builder()
                .email(normalizeEmail(request.email()))
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(request.phone())
                .role(Role.CUSTOMER)
                .build();
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse createUser(User user) {
        user.setEmail(normalizeEmail(user.getEmail()));
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return UserResponse.from(userRepository.save(user));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
