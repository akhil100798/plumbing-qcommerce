package com.pqc.core.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SeedPropertiesTest {

    private SeedProperties properties;

    @Mock
    private Environment env;

    @BeforeEach
    void setUp() {
        properties = new SeedProperties();
        properties.setEnv(env);
    }

    @Test
    void whenProdProfileActiveAndAllSeedsDisabled_shouldPassValidation() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        properties.setDemoEnabled(false);
        properties.setCatalogEnabled(false);
        properties.setAdminDemoEnabled(false);

        assertThatCode(() -> properties.validate()).doesNotThrowAnyException();
    }

    @Test
    void whenProdProfileActiveAndDemoSeedEnabled_shouldThrowIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        properties.setDemoEnabled(true);

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production configuration violation");
    }

    @Test
    void whenProdProfileActiveAndAdminDemoSeedEnabled_shouldThrowIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        properties.setAdminDemoEnabled(true);

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production configuration violation");
    }

    @Test
    void whenProdProfileActiveAndCatalogSeedEnabled_shouldThrowIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        properties.setCatalogEnabled(true);

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production configuration violation");
    }

    @Test
    void whenNonProdProfileActiveAndSeedsEnabled_shouldPassValidation() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"local"});
        properties.setDemoEnabled(true);
        properties.setCatalogEnabled(true);
        properties.setAdminDemoEnabled(true);

        assertThatCode(() -> properties.validate()).doesNotThrowAnyException();
    }

    @Test
    void whenProdProfileActiveButFailIfProdDisabledAndSeedsEnabled_shouldPassValidation() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        properties.setFailIfProdDemoEnabled(false);
        properties.setDemoEnabled(true);
        properties.setCatalogEnabled(true);
        properties.setAdminDemoEnabled(true);
        properties.setDemoPassword("a-strong-custom-password-999");

        assertThatCode(() -> properties.validate()).doesNotThrowAnyException();
    }

    @Test
    void whenMixedProdAndDemoProfileActiveAndAdminDemoSeedEnabled_shouldThrowIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod", "demo"});
        properties.setAdminDemoEnabled(true);

        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production configuration violation");
    }

    @Test
    void whenProdProfileActiveAndSeedingEnabledWithWeakPassword_shouldThrowIllegalStateException() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        properties.setFailIfProdDemoEnabled(false); // allow seeding flag, but password check must still run
        properties.setDemoEnabled(true);
        
        properties.setDemoPassword("password");
        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot use a weak default password");

        properties.setDemoPassword("admin");
        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot use a weak default password");

        properties.setDemoPassword("123456");
        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot use a weak default password");

        properties.setDemoPassword("");
        assertThatThrownBy(() -> properties.validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must not be blank");
    }
}
