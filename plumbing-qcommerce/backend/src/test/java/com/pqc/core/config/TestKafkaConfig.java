package com.pqc.core.config;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.concurrent.CompletableFuture;

@TestConfiguration
public class TestKafkaConfig {

    @Bean
    @Primary
    @SuppressWarnings("unchecked")
    public KafkaTemplate<String, String> testKafkaTemplate() {
        KafkaTemplate<String, String> mockTemplate = Mockito.mock(KafkaTemplate.class);
        Mockito.when(mockTemplate.send(Mockito.anyString(), Mockito.anyString()))
               .thenReturn(CompletableFuture.completedFuture(null));
        Mockito.when(mockTemplate.send(Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
               .thenReturn(CompletableFuture.completedFuture(null));
        return mockTemplate;
    }
}
