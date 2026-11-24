package com.pqc.core.config;

import com.pqc.core.PlumbingCoreApplication;
import org.junit.jupiter.api.Test;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProfileConflictSanitizerTest {

    @Test
    void stripsStagingWhenBothProdAndStagingAreActive() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod", "staging");
        env.setProperty("SMS_PROVIDER", "disabled");
        env.setProperty("app.seed.staging-admin-enabled", "true");

        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.getEnvironment()).thenReturn(env);

        new PlumbingCoreApplication.ProfileConflictSanitizer().initialize(context);

        assertThat(env.getActiveProfiles()).containsExactly("prod");
        assertThat(env.getProperty("app.seed.staging-admin-enabled")).isEqualTo("false");
        assertThat(env.getProperty("app.sms.provider")).isEqualTo("mock");
        assertThat(env.getProperty("spring.profiles.active")).isEqualTo("prod");
    }

    @Test
    void stripsLocalStagingAndHandlesCaseInsensitivity() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("PROD", "local-staging");

        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.getEnvironment()).thenReturn(env);

        new PlumbingCoreApplication.ProfileConflictSanitizer().initialize(context);

        assertThat(env.getActiveProfiles()).containsExactly("PROD");
        assertThat(env.getProperty("spring.profiles.active")).isEqualTo("PROD");
    }

    @Test
    void preservesStagingWhenProdIsNotActive() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("staging");

        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.getEnvironment()).thenReturn(env);

        new PlumbingCoreApplication.ProfileConflictSanitizer().initialize(context);

        assertThat(env.getActiveProfiles()).containsExactly("staging");
        assertThat(env.getProperty("app.sms.provider")).isNull();
    }

    @Test
    void preservesProdWhenStagingIsNotActive() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.getEnvironment()).thenReturn(env);

        new PlumbingCoreApplication.ProfileConflictSanitizer().initialize(context);

        assertThat(env.getActiveProfiles()).containsExactly("prod");
    }
}
