package com.pqc.core.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"local-staging", "test"})
class CorsConfigurationSecurityTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void explicitLocalAppOriginsCanPreflightLogin() throws Exception {
        for (String origin : new String[] {
                "http://localhost:3101",
                "http://localhost:19007",
                "http://localhost:19008",
                "http://localhost:19009",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:3002",
                "http://127.0.0.1:3101"
        }) {
            mvc.perform(options("/api/v1/auth/login")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
    }

    @Test
    void vercelPreviewOriginsCanPreflightLogin() throws Exception {
        for (String origin : new String[] {
                "https://fixkart-customer-preview.vercel.app",
                "https://fixkart-plumber-app-git-dev-2.vercel.app",
                "https://fixkart-store-counter.vercel.app"
        }) {
            mvc.perform(options("/api/v1/auth/login")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
    }

    @Test
    void localStagingDoesNotAllowLoopbackWildcardOrigins() throws Exception {
        mvc.perform(options("/api/v1/auth/login")
                .header("Origin", "http://127.0.0.1:19007")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void badOriginIsRejectedWithoutServerError() throws Exception {
        for (String badOrigin : new String[] {
                "http://evil.example",
                "https://evil.vercel.app.attacker.com",
                "https://attacker-vercel.app"
        }) {
            mvc.perform(options("/api/v1/auth/login")
                    .header("Origin", badOrigin)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        }
    }
}
