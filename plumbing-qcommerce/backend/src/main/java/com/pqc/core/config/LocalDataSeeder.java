package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalDataSeeder implements CommandLineRunner {

    private static final String PASSWORD = "LocalPass123!";

    private final UserRepository users;
    private final StoreRepository stores;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User admin = seedUser("admin@plumb.local", "Local Admin", "9000000001", Role.ADMIN);
        User manager = seedUser("manager@plumb.local", "Local Manager", "9000000002", Role.STORE_MANAGER);
        seedUser("customer@plumb.local", "Local Customer", "9000000003", Role.CUSTOMER);
        seedUser("plumber1@plumb.local", "Local Plumber One", "9000000004", Role.PLUMBER);
        seedUser("plumber2@plumb.local", "Local Plumber Two", "9000000005", Role.PLUMBER);

        if (stores.count() == 0) {
            stores.save(Store.builder()
                    .name("Plumb Local Store")
                    .address("Local Simulator Hub, Bengaluru")
                    .latitude(12.9716)
                    .longitude(77.5946)
                    .manager(manager)
                    .build());
        }
    }

    private User seedUser(String email, String fullName, String phone, Role role) {
        return users.findByEmail(email).orElseGet(() -> users.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(PASSWORD))
                .fullName(fullName)
                .phone(phone)
                .role(role)
                .build()));
    }
}
