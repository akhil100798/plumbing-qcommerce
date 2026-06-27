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

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinanceAdminControllerTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired StoreRepository storeRepository;
    @Autowired ProductOrderRepository productOrderRepository;
    @Autowired SettlementRepository settlementRepository;
    @Autowired RefundRequestRepository refundRequestRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    private User superAdmin;
    private User admin;
    private User financeAdmin;
    private User customer;
    private ProductOrder order;
    private RefundRequest refund;

    @BeforeEach
    void setUp() {
        truncateTables();
        superAdmin = saveUser("super-fin@example.com", Role.SUPER_ADMIN);
        admin = saveUser("admin-fin@example.com", Role.ADMIN);
        financeAdmin = saveUser("finance@example.com", Role.FINANCE_ADMIN);
        customer = saveUser("customer-fin@example.com", Role.CUSTOMER);
        User storeManager = saveUser("store-fin@example.com", Role.STORE_MANAGER);
        Store store = storeRepository.save(Store.builder().name("Finance Store").address("Mumbai").latitude(19.07).longitude(72.87).manager(storeManager).build());
        order = productOrderRepository.save(ProductOrder.builder().customer(customer).store(store).totalAmount(new BigDecimal("1000.00")).status(ProductOrderStatus.CONFIRMED).build());
        settlementRepository.save(Settlement.builder().beneficiaryType(BeneficiaryType.STORE).beneficiaryId(store.getId()).grossAmount(new BigDecimal("1000.00")).commissionAmount(new BigDecimal("100.00")).netAmount(new BigDecimal("900.00")).status(SettlementStatus.PENDING).build());
        refund = refundRequestRepository.save(RefundRequest.builder().orderId(order.getId()).customerId(customer.getId()).amount(new BigDecimal("100.00")).reason("Failed delivery").status(RefundStatus.PENDING).build());
    }

    @Test void superAdminCanAccessFinanceDashboard() throws Exception { mvc.perform(get("/api/v1/admin/finance/dashboard").header("Authorization", bearer(superAdmin))).andExpect(status().isOk()); }
    @Test void adminCanAccessFinanceDashboard() throws Exception { mvc.perform(get("/api/v1/admin/finance/dashboard").header("Authorization", bearer(admin))).andExpect(status().isOk()); }
    @Test void financeAdminCanAccessFinanceDashboard() throws Exception { mvc.perform(get("/api/v1/admin/finance/dashboard").header("Authorization", bearer(financeAdmin))).andExpect(status().isOk()).andExpect(jsonPath("$.successfulPayments").value(1)); }

    @Test
    void financeAdminCanListFinanceResources() throws Exception {
        mvc.perform(get("/api/v1/admin/finance/payments").header("Authorization", bearer(financeAdmin))).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].orderId").value(order.getId()));
        mvc.perform(get("/api/v1/admin/finance/settlements/stores").header("Authorization", bearer(financeAdmin))).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].storeName").value("Finance Store"));
        mvc.perform(get("/api/v1/admin/finance/refunds").header("Authorization", bearer(financeAdmin))).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].refundId").value(refund.getId()));
    }

    @Test
    void financeAdminCanApproveAndRejectPendingRefunds() throws Exception {
        mvc.perform(patch("/api/v1/admin/finance/refunds/{id}/approve", refund.getId()).header("Authorization", bearer(financeAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"Approved due to failed delivery\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));
        RefundRequest second = refundRequestRepository.save(RefundRequest.builder().orderId(order.getId()).customerId(customer.getId()).amount(new BigDecimal("50.00")).reason("Duplicate").status(RefundStatus.PENDING).build());
        mvc.perform(patch("/api/v1/admin/finance/refunds/{id}/reject", second.getId()).header("Authorization", bearer(financeAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"Rejected because delivered\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void cannotApproveAlreadyProcessedRefund() throws Exception {
        refund.setStatus(RefundStatus.APPROVED);
        refundRequestRepository.save(refund);
        mvc.perform(patch("/api/v1/admin/finance/refunds/{id}/approve", refund.getId()).header("Authorization", bearer(financeAdmin)).contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"Again\"}"))
                .andExpect(status().isConflict());
    }

    private User saveUser(String email, Role role) { return userRepository.save(User.builder().email(email).password(passwordEncoder.encode("password")).fullName(role.name() + " User").phone("9" + Math.abs(email.hashCode())).role(role).status(UserStatus.ACTIVE).build()); }
    private String bearer(User user) { return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name()); }
    private void truncateTables() { jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE"); for (String table : new String[]{"refund_requests","settlements","outbox_events","inventory_reservations","product_order_items","product_orders","service_orders","stocks","stores","user_addresses","wallet_transactions","wallets","refresh_tokens","notifications","users"}) jdbcTemplate.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY"); jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE"); }
}