package com.pqc.core.controller;

import com.pqc.core.entity.Role;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SelfRegistrationIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired UserRepository users;
    @Autowired StoreRepository stores;

    @Test
    void plumberCanSelfRegister() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register/plumber")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Local Plumber","email":"local.plumber@example.com","phone":"9876500011","password":"password123","confirmPassword":"password123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("PLUMBER"))
                .andExpect(jsonPath("$.token").isNotEmpty());
        assertThat(users.findByEmail("local.plumber@example.com")).get().extracting("role").isEqualTo(Role.PLUMBER);
    }

    @Test
    void storeCanSelfRegisterWithLinkedStore() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Local Manager","email":"local.store@example.com","phone":"9876500012","password":"password123","confirmPassword":"password123","storeName":"Local Test Store","storeAddress":"Hyderabad","latitude":17.385,"longitude":78.4867}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("STORE_MANAGER"));
        var manager = users.findByEmail("local.store@example.com").orElseThrow();
        assertThat(stores.findFirstByManager_Id(manager.getId())).get().extracting("name").isEqualTo("Local Test Store");
    }
}
