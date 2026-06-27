package com.pqc.core.security;

import com.pqc.core.repository.CategoryRepository;
import com.pqc.core.repository.InventoryReservationRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ProductRepository;
import com.pqc.core.repository.StockRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserEndpointSecurityTest {

    @Autowired private MockMvc mvc;

    @Autowired private UserRepository userRepository;
    @Autowired private ServiceOrderRepository serviceOrderRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private OutboxEventRepository outboxRepository;
    @Autowired private InventoryReservationRepository reservationRepository;
    @Autowired private ProductOrderRepository productOrderRepository;
    @Autowired private StockRepository stockRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;

    @BeforeEach
    void clearUsers() {
        // Delete in FK dependency order: children first, parents last
        reservationRepository.deleteAll();
        reservationRepository.flush();
        productOrderRepository.deleteAll();
        productOrderRepository.flush();
        serviceOrderRepository.deleteAll();
        serviceOrderRepository.flush();
        outboxRepository.deleteAll();
        outboxRepository.flush();
        stockRepository.deleteAll();
        stockRepository.flush();
        productRepository.deleteAll();
        productRepository.flush();
        categoryRepository.deleteAll();
        categoryRepository.flush();
        storeRepository.deleteAll();
        storeRepository.flush();
        userRepository.deleteAll();
        userRepository.flush();
    }

    @Test
    void registrationForcesCustomerAndNeverReturnsPassword() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "new@example.com",
                      "password": "Password123!",
                      "fullName": "New User",
                      "phone": "9999999999",
                      "role": "ADMIN"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void anonymousUserEnumerationIsRejected() throws Exception {
        mvc.perform(get("/api/v1/users"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void loginDoesNotRevealWhetherAccountExists() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "known@example.com",
                      "password": "Password123!",
                      "fullName": "Known User",
                      "phone": "9999999999"
                    }
                    """))
            .andExpect(status().isCreated());

        String credentials = "{\"email\":\"%s\",\"password\":\"WrongPassword123!\"}";

        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials.formatted("known@example.com")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));

        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials.formatted("missing@example.com")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }
}
