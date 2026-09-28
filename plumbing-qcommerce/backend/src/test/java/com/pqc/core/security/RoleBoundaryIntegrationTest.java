package com.pqc.core.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoleBoundaryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("CUSTOMER role cannot access Admin operations endpoint")
    void customerCannotAccessAdminOperations() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/dashboard")
                        .with(user("customer@example.com").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PLUMBER role cannot access Admin finance endpoint")
    void plumberCannotAccessAdminFinance() throws Exception {
        mockMvc.perform(get("/api/v1/admin/finance/summary")
                        .with(user("plumber@example.com").roles("PLUMBER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STORE_MANAGER role cannot access Plumber availability mutation")
    void storeManagerCannotAccessPlumberAvailability() throws Exception {
        mockMvc.perform(post("/api/v1/users/me/availability")
                        .with(user("store@example.com").roles("STORE_MANAGER")))
                .andExpect(status().isForbidden());
    }
}
