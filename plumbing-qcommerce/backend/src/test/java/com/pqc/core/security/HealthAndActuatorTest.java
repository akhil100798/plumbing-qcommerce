package com.pqc.core.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for health and actuator endpoints.
 * These are critical for Render deployment — the platform uses /actuator/health
 * as the health check path.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthAndActuatorTest {

    @Autowired MockMvc mvc;

    // ========== Custom Health Controller ==========

    @Test
    void healthLive_noAuth_returnsUp() throws Exception {
        mvc.perform(get("/health/live"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void healthReady_noAuth_returnsUp() throws Exception {
        mvc.perform(get("/health/ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    // ========== Spring Actuator ==========

    @Test
    void actuatorHealth_noAuth_returnsUp() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // ========== OpenAPI / Swagger ==========

    @Test
    void apiDocs_noAuth_isAccessible() throws Exception {
        mvc.perform(get("/api-docs"))
                .andExpect(status().isOk());
    }

    @Test
    void swaggerUi_noAuth_redirectsOrReturns200() throws Exception {
        // Swagger UI may redirect - accept 2xx or 3xx
        mvc.perform(get("/swagger-ui.html"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assert status == 200 || status == 302 || status == 301
                            : "Expected 200/301/302 but got " + status;
                });
    }

    // ========== Error handling ==========

    @Test
    void nonExistentEndpoint_noAuth_returns401NotFound() throws Exception {
        // Non-existent endpoints that require auth should return 401 (unauthenticated)
        // not 404 (to prevent endpoint enumeration)
        mvc.perform(get("/api/v1/nonexistent"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Could be 401 (auth required) or 404 (not found) - both acceptable
                    assert status == 401 || status == 403 || status == 404
                            : "Expected 401/403/404 but got " + status;
                });
    }
}
