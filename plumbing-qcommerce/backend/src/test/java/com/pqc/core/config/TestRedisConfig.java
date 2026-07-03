package com.pqc.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doAnswer;

@Configuration
@Profile("test")
public class TestRedisConfig {

    private final Map<String, String> fakeRedisStore = new ConcurrentHashMap<>();
    private final Map<String, Long> attemptsStore = new ConcurrentHashMap<>();

    @Bean
    @Primary
    public StringRedisTemplate stringRedisTemplate() {
        StringRedisTemplate mockTemplate = mock(StringRedisTemplate.class);
        ValueOperations<String, String> mockOps = mock(ValueOperations.class);

        when(mockTemplate.opsForValue()).thenReturn(mockOps);

        // Mock SET with TTL
        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            String val = invocation.getArgument(1);
            fakeRedisStore.put(key, val);
            return null;
        }).when(mockOps).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));

        // Mock SET without TTL
        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            String val = invocation.getArgument(1);
            fakeRedisStore.put(key, val);
            return null;
        }).when(mockOps).set(anyString(), anyString());

        // Mock GET
        when(mockOps.get(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return fakeRedisStore.get(key);
        });

        // Mock DELETE
        when(mockTemplate.delete(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            fakeRedisStore.remove(key);
            attemptsStore.remove(key);
            return true;
        });

        // Mock HAS KEY
        when(mockTemplate.hasKey(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return fakeRedisStore.containsKey(key);
        });

        // Mock INCREMENT (for attempts)
        when(mockOps.increment(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            Long current = attemptsStore.getOrDefault(key, 0L);
            current++;
            attemptsStore.put(key, current);
            return current;
        });

        return mockTemplate;
    }
}
