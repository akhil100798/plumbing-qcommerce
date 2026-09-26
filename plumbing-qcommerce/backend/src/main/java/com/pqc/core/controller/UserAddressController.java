package com.pqc.core.controller;

import com.pqc.core.entity.User;
import com.pqc.core.entity.UserAddress;
import com.pqc.core.repository.UserAddressRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserAddressController {

    private final UserAddressRepository userAddressRepository;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<UserAddress>> getAddresses() {
        User user = currentUser.require();
        return ResponseEntity.ok(userAddressRepository.findByUserId(user.getId()));
    }

    @PostMapping
    public ResponseEntity<UserAddress> addAddress(@RequestBody UserAddress address) {
        User user = currentUser.require();
        address.setUser(user);
        return ResponseEntity.ok(userAddressRepository.save(address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        User user = currentUser.require();
        UserAddress address = userAddressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this address");
        }
        userAddressRepository.delete(address);
        return ResponseEntity.ok().build();
    }
}
