package com.pqc.core.security;

import com.pqc.core.entity.*;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlumberManagerSecurityTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach void clean() { jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE"); for (String table : new String[]{"plumber_kyc","support_messages","support_tickets","refund_requests","settlements","outbox_events","inventory_reservations","product_order_items","product_orders","service_orders","stocks","stores","user_addresses","wallet_transactions","wallets","refresh_tokens","notifications","users"}) try { jdbc.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY"); } catch (Exception ignored) {} jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE"); }

    @Test void allowedRolesCanAccessDashboard() throws Exception { for (Role role : new Role[]{Role.SUPER_ADMIN, Role.ADMIN, Role.PLUMBER_MANAGER}) mvc.perform(get("/api/v1/admin/plumber-manager/dashboard").header("Authorization", bearer(save(role)))).andExpect(status().isOk()); }
    @Test void otherRolesCannotAccessDashboard() throws Exception { for (Role role : new Role[]{Role.OPERATIONS_ADMIN, Role.FINANCE_ADMIN, Role.SUPPORT_ADMIN, Role.MARKETING_ADMIN, Role.CUSTOMER, Role.PLUMBER, Role.STORE_MANAGER, Role.DELIVERY_PARTNER}) mvc.perform(get("/api/v1/admin/plumber-manager/dashboard").header("Authorization", bearer(save(role)))).andExpect(status().isForbidden()); }

    private User save(Role role) { return users.save(User.builder().email(role.name().toLowerCase()+"@pm.test").password(encoder.encode("password")).fullName(role.name()).phone("9"+role.ordinal()).role(role).status(UserStatus.ACTIVE).build()); }
    private String bearer(User user) { return "Bearer " + jwt.generateToken(user.getEmail(), user.getRole().name()); }
}
