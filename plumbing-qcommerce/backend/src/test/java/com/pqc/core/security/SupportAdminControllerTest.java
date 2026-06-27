package com.pqc.core.security;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SupportAdminControllerTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired SupportTicketRepository supportTicketRepository;
    @Autowired SupportMessageRepository supportMessageRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    private User superAdmin;
    private User admin;
    private User supportAdmin;
    private User customer;
    private SupportTicket ticket;

    @BeforeEach
    void setUp() {
        truncateTables();
        superAdmin = saveUser("super-support@example.com", Role.SUPER_ADMIN);
        admin = saveUser("admin-support@example.com", Role.ADMIN);
        supportAdmin = saveUser("support@example.com", Role.SUPPORT_ADMIN);
        customer = saveUser("customer-support@example.com", Role.CUSTOMER);
        ticket = supportTicketRepository.save(SupportTicket.builder()
                .ticketNumber("SUP-000001")
                .requesterId(customer.getId())
                .requesterRole(Role.CUSTOMER)
                .category(SupportTicketCategory.DELIVERY)
                .priority(SupportTicketPriority.HIGH)
                .status(SupportTicketStatus.OPEN)
                .subject("Delivery delayed")
                .description("Customer says delivery is delayed")
                .build());
    }

    @Test void superAdminCanAccessSupportDashboard() throws Exception { mvc.perform(get("/api/v1/admin/support/dashboard").header("Authorization", bearer(superAdmin))).andExpect(status().isOk()); }
    @Test void adminCanAccessSupportDashboard() throws Exception { mvc.perform(get("/api/v1/admin/support/dashboard").header("Authorization", bearer(admin))).andExpect(status().isOk()); }
    @Test void supportAdminCanAccessSupportDashboard() throws Exception { mvc.perform(get("/api/v1/admin/support/dashboard").header("Authorization", bearer(supportAdmin))).andExpect(status().isOk()).andExpect(jsonPath("$.openTickets").value(1)); }

    @Test
    void supportAdminCanCreateTicketAndAddMessage() throws Exception {
        String createBody = "{\"requesterId\":" + customer.getId() + ",\"requesterRole\":\"CUSTOMER\",\"category\":\"PAYMENT\",\"priority\":\"URGENT\",\"subject\":\"Payment failed\",\"description\":\"Customer paid but order is pending\"}";
        mvc.perform(post("/api/v1/admin/support/tickets").header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content(createBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject").value("Payment failed"))
                .andExpect(jsonPath("$.ticketNumber").isNotEmpty());

        mvc.perform(post("/api/v1/admin/support/tickets/{id}/messages", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"We are checking with operations.\",\"internalNote\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("We are checking with operations."));
    }

    @Test
    void supportAdminCanManageTicketWorkflow() throws Exception {
        mvc.perform(patch("/api/v1/admin/support/tickets/{id}/assign", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"adminUserId\":" + supportAdmin.getId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignedAdminName").value(supportAdmin.getFullName()));
        mvc.perform(patch("/api/v1/admin/support/tickets/{id}/status", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        mvc.perform(patch("/api/v1/admin/support/tickets/{id}/escalate", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Requires finance refund review\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ESCALATED"));
        mvc.perform(patch("/api/v1/admin/support/tickets/{id}/close", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"resolutionNote\":\"Issue resolved with customer\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void supportAdminCanReadTicketDetailAndUserContext() throws Exception {
        supportMessageRepository.save(SupportMessage.builder().ticketId(ticket.getId()).senderId(supportAdmin.getId()).senderRole(Role.SUPPORT_ADMIN).message("Internal check").internalNote(true).build());
        mvc.perform(get("/api/v1/admin/support/tickets/{id}", ticket.getId()).header("Authorization", bearer(supportAdmin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ticketNumber").value("SUP-000001")).andExpect(jsonPath("$.messages[0].message").value("Internal check"));
        mvc.perform(get("/api/v1/admin/support/context/user/{id}", customer.getId()).header("Authorization", bearer(supportAdmin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(customer.getId())).andExpect(jsonPath("$.previousTickets[0].ticketId").value(ticket.getId()));
    }

    @Test
    void invalidWorkflowActionsAreRejected() throws Exception {
        mvc.perform(patch("/api/v1/admin/support/tickets/{id}/status", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isConflict());
        mvc.perform(patch("/api/v1/admin/support/tickets/{id}/assign", ticket.getId()).header("Authorization", bearer(supportAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"adminUserId\":" + customer.getId() + "}"))
                .andExpect(status().isBadRequest());
    }

    private User saveUser(String email, Role role) { return userRepository.save(User.builder().email(email).password(passwordEncoder.encode("password")).fullName(role.name() + " User").phone("9" + Math.abs(email.hashCode())).role(role).status(UserStatus.ACTIVE).build()); }
    private String bearer(User user) { return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name()); }
    private void truncateTables() { jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE"); for (String table : new String[]{"support_messages","support_tickets","refund_requests","settlements","outbox_events","inventory_reservations","product_order_items","product_orders","service_orders","stocks","stores","user_addresses","wallet_transactions","wallets","refresh_tokens","notifications","users"}) jdbcTemplate.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY"); jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE"); }
}