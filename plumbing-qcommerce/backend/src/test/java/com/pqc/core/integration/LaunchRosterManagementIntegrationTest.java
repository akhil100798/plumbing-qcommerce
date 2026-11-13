package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.LaunchPolicyService;
import com.pqc.core.service.LaunchRosterManagementService;
import com.pqc.core.service.PlumberEligibilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.dao.DataAccessException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LaunchRosterManagementIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired LaunchPolicyRepository policies;
    @Autowired LaunchPlumberRosterRepository roster;
    @Autowired PlumberKycRepository kycs;
    @Autowired LaunchRosterAuditHistoryRepository audit;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired LaunchRosterManagementService rosterService;
    @Autowired PlumberEligibilityService eligibilityService;
    @Autowired JdbcTemplate jdbc;
    @MockitoSpyBean LaunchRosterAuditHistoryRepository auditSpy;

    private User admin;
    private User superAdmin;
    private User operationsAdmin;
    private User plumberManager;
    private User customer;
    private User plumber;
    private LaunchPolicy policy;

    @BeforeEach
    void setup() {
        jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String table : new String[]{"launch_roster_audit_history", "launch_plumber_roster", "launch_policies", "plumber_kyc", "support_messages", "support_tickets", "refund_requests", "settlements", "outbox_events", "inventory_reservations", "product_order_items", "product_orders", "service_orders", "stocks", "stores", "user_addresses", "wallet_transactions", "wallets", "refresh_tokens", "notifications", "users"}) {
            try { jdbc.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY"); } catch (Exception ignored) { }
        }
        jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
        admin = save("admin@roster.test", Role.ADMIN, UserStatus.ACTIVE);
        superAdmin = save("super@roster.test", Role.SUPER_ADMIN, UserStatus.ACTIVE);
        operationsAdmin = save("ops@roster.test", Role.OPERATIONS_ADMIN, UserStatus.ACTIVE);
        plumberManager = save("manager@roster.test", Role.PLUMBER_MANAGER, UserStatus.ACTIVE);
        save("finance@roster.test", Role.FINANCE_ADMIN, UserStatus.ACTIVE);
        save("support@roster.test", Role.SUPPORT_ADMIN, UserStatus.ACTIVE);
        save("marketing@roster.test", Role.MARKETING_ADMIN, UserStatus.ACTIVE);
        save("store@roster.test", Role.STORE_MANAGER, UserStatus.ACTIVE);
        customer = save("customer@roster.test", Role.CUSTOMER, UserStatus.ACTIVE);
        plumber = save("plumber@roster.test", Role.PLUMBER, UserStatus.ACTIVE);
        policy = policies.saveAndFlush(LaunchPolicy.builder().policyKey(LaunchPolicyService.SERVICE_POLICY_KEY)
                .active(false).rosterEnforcementEnabled(false).currency("INR").build());
        kycs.saveAndFlush(PlumberKyc.builder().plumberId(plumber.getId()).status(PlumberKycStatus.APPROVED)
                .availabilityStatus(PlumberAvailabilityStatus.OFFLINE).build());
    }

    @Test
    void adminCanReadActivateIdempotentlyDeactivateAndAuditEachTransition() throws Exception {
        String token = bearer(admin);
        String activatePath = "/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}";

        mvc.perform(get("/api/v1/admin/launch-roster/policies").header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].policyId").value(policy.getId()))
                .andExpect(jsonPath("$[0].rosterEnforcementEnabled").value(false));
        mvc.perform(get("/api/v1/admin/launch-roster/policies/{policyId}/members", policy.getId()).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].plumberId").value(plumber.getId()))
                .andExpect(jsonPath("$[0].kycStatus").value("APPROVED"))
                .andExpect(jsonPath("$[0].availabilityStatus").value("OFFLINE"))
                .andExpect(jsonPath("$[0].rosterApproved").value(false))
                .andExpect(jsonPath("$[0].aadhaarNumberMasked").doesNotExist());

        mvc.perform(post(activatePath, policy.getId(), plumber.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Verified for service launch\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rosterApproved").value(true))
                .andExpect(jsonPath("$.availabilityStatus").value("OFFLINE"));
        mvc.perform(post(activatePath, policy.getId(), plumber.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Repeated request\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rosterApproved").value(true));
        org.assertj.core.api.Assertions.assertThat(roster.count()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(audit.count()).isEqualTo(1);

        String deactivatePath = activatePath + "/deactivate";
        mvc.perform(patch(deactivatePath, policy.getId(), plumber.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Membership ended\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rosterApproved").value(false));
        mvc.perform(patch(deactivatePath, policy.getId(), plumber.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Repeated request\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rosterApproved").value(false));

        org.assertj.core.api.Assertions.assertThat(roster.count()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(audit.count()).isEqualTo(2);
    }

    @Test
    void superAdminCanManageRosterAndWrongRoleOrKycIsRejected() throws Exception {
        mvc.perform(post("/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}", policy.getId(), plumber.getId())
                        .header("Authorization", bearer(superAdmin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Authorized check\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}", policy.getId(), customer.getId())
                        .header("Authorization", bearer(superAdmin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Wrong role\"}"))
                .andExpect(status().isConflict());
        User pending = save("pending@roster.test", Role.PLUMBER, UserStatus.ACTIVE);
        kycs.saveAndFlush(PlumberKyc.builder().plumberId(pending.getId()).status(PlumberKycStatus.PENDING).build());
        mvc.perform(post("/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}", policy.getId(), pending.getId())
                        .header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Pending KYC\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}", policy.getId(), 999999L)
                        .header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Missing plumber\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}", 999999L, plumber.getId())
                        .header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Missing policy\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyAdminsCanAccessAndUnauthenticatedRequestsAreRejected() throws Exception {
        String path = "/api/v1/admin/launch-roster/policies";
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        User finance = users.findByEmail("finance@roster.test").orElseThrow();
        User support = users.findByEmail("support@roster.test").orElseThrow();
        User marketing = users.findByEmail("marketing@roster.test").orElseThrow();
        User storeManager = users.findByEmail("store@roster.test").orElseThrow();
        for (User denied : new User[]{operationsAdmin, plumberManager, customer, plumber, finance, support, marketing, storeManager}) {
            mvc.perform(get(path).header("Authorization", bearer(denied))).andExpect(status().isForbidden());
        }
    }

    @Test
    void auditFailureRollsBackMembershipMutation() throws Exception {
        doThrow(new IllegalStateException("simulated audit persistence failure")).when(auditSpy).save(any(LaunchRosterAuditHistory.class));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> rosterService.activate(
                policy.getId(), plumber.getId(), admin.getId(), "rollback verification"))
                .isInstanceOf(IllegalStateException.class);
        org.assertj.core.api.Assertions.assertThat(roster.count()).isZero();
        org.assertj.core.api.Assertions.assertThat(audit.count()).isZero();
    }

    @Test
    void rosterTransitionsChangeEligibilityOnlyWhenEnforcementIsEnabled() throws Exception {
        jdbc.update("UPDATE plumber_kyc SET availability_status='ONLINE' WHERE plumber_id=?", plumber.getId());
        policy.setActive(true);
        policy.setRosterEnforcementEnabled(false);
        policies.saveAndFlush(policy);
        org.assertj.core.api.Assertions.assertThat(eligibilityService.isEligibleForLaunch(plumber)).isTrue();

        policy.setRosterEnforcementEnabled(true);
        policies.saveAndFlush(policy);
        org.assertj.core.api.Assertions.assertThat(eligibilityService.isEligibleForLaunch(plumber)).isFalse();

        rosterService.activate(policy.getId(), plumber.getId(), admin.getId(), "Add to active roster");
        org.assertj.core.api.Assertions.assertThat(eligibilityService.isEligibleForLaunch(plumber)).isTrue();
        rosterService.deactivate(policy.getId(), plumber.getId(), admin.getId(), "Remove from active roster");
        org.assertj.core.api.Assertions.assertThat(eligibilityService.isEligibleForLaunch(plumber)).isFalse();
    }

    private User save(String email, Role role, UserStatus status) {
        return users.saveAndFlush(User.builder().email(email).password(encoder.encode("Password123!"))
                .fullName(role.name()).phone("9" + Math.abs(email.hashCode())).role(role).status(status).build());
    }

    private String bearer(User user) {
        return "Bearer " + jwt.generateToken(user.getEmail(), user.getRole().name());
    }
}
