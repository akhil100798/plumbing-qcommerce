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
class SmsPropertiesTest {
    @Mock private Environment env;
    private SmsProperties properties;

    @BeforeEach
    void setUp() {
        properties = new SmsProperties();
        properties.setEnv(env);
    }

    @Test
    void prodRejectsProviderNone() {
        prod();
        properties.setProvider("none");
        assertThatThrownBy(properties::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void prodRejectsBlankProvider() {
        prod();
        properties.setProvider(" ");
        assertThatThrownBy(properties::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void prodRejectsLocalCaptureProvider() {
        prod();
        properties.setProvider("local-capture");
        assertThatThrownBy(properties::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void prodRejectsLocalCaptureEnabled() {
        prod();
        properties.setProvider("real-provider");
        properties.setLocalCaptureEnabled(true);
        assertThatThrownBy(properties::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void localStagingAllowsExplicitLocalCapture() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"local-staging"});
        properties.setProvider("local-capture");
        properties.setLocalCaptureEnabled(true);
        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    private void prod() {
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
    }
}
