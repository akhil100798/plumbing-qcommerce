package com.pqc.core.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles({"staging", "test"})
@TestPropertySource(properties = {
        "spring.data.redis.host=",
        "features.delivery-enabled=false",
        "app.seed.staging-admin.enabled=false",
        "app.photos.provider=local",
        "app.photos.fail-if-missing-provider=false"
})
class RedisFreeContextBootstrapTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("14 & 15. Staging application context starts cleanly without Redis host")
    void test_stagingContextStartsWithoutRedis() {
        assertThat(applicationContext).isNotNull();
        assertThat(applicationContext.containsBean("jwtAuthenticationFilter")).isTrue();
        assertThat(applicationContext.containsBean("authenticationController")).isTrue();
        assertThat(applicationContext.containsBean("tokenRevocationService")).isTrue();
        assertThat(applicationContext.containsBean("deliveryOtpService")).isTrue();
        assertThat(applicationContext.containsBean("superAdminService")).isTrue();

        // Verify that application context is active and running cleanly
        assertThat(applicationContext.getId()).isNotEmpty();
    }
}
