package com.pqc.core.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BackendLogSafetyConfigurationTest {

    @Autowired
    Environment environment;

    @Test
    void disablesSpringMvcRequestAndResponseBodyDebugLogging() {
        assertThat(environment.getProperty(
                "logging.level.org.springframework.web.servlet.mvc.method.annotation.RequestResponseBodyMethodProcessor"
        )).isEqualTo("WARN");
        assertThat(environment.getProperty(
                "logging.level.org.springframework.web.servlet.mvc.method.annotation.HttpEntityMethodProcessor"
        )).isEqualTo("WARN");
    }
}
