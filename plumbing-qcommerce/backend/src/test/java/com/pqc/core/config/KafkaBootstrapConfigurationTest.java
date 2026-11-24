package com.pqc.core.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class KafkaBootstrapConfigurationTest {

    @Test
    void localDefaultUsesHostMappedBrokerAndSupportsEnvironmentOverride() throws Exception {
        String yaml = new ClassPathResource("application.yml")
                .getContentAsString(StandardCharsets.UTF_8);

        assertThat(yaml).contains(
                "${SPRING_KAFKA_BOOTSTRAP_SERVERS:${KAFKA_BOOTSTRAP_SERVERS:localhost:29092}}"
        );
    }

    @Test
    void testProfileUsesTheSameHostDefaultAndEnvironmentOverride() throws Exception {
        String yaml = Files.readString(
                Path.of("src/main/resources/application-test.yml"), StandardCharsets.UTF_8);

        assertThat(yaml).contains("${SPRING_KAFKA_BOOTSTRAP_SERVERS:localhost:29092}");
    }
}
