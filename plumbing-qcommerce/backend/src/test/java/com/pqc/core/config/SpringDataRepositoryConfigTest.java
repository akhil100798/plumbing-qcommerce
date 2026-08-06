package com.pqc.core.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.pqc.core.document.AuditLogEventRepository;
import com.pqc.core.document.ServiceLogRepository;
import com.pqc.core.repository.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
public class SpringDataRepositoryConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void jpaRepositoriesAreRegistered() {
        assertThat(applicationContext.containsBean("userRepository")).isTrue();
        assertThat(applicationContext.getBean(UserRepository.class)).isNotNull();
    }

    @Test
    void mongoRepositoriesAreRegistered() {
        assertThat(applicationContext.containsBean("auditLogEventRepository")).isTrue();
        assertThat(applicationContext.getBean(AuditLogEventRepository.class)).isNotNull();
        assertThat(applicationContext.containsBean("serviceLogRepository")).isTrue();
        assertThat(applicationContext.getBean(ServiceLogRepository.class)).isNotNull();
    }

    @Test
    void redisRepositoryScanningIsDisabled() {
        // Redis repository scanning should be disabled, so no RedisKeyValueAdapter or Redis repository bean definitions exist
        assertThat(applicationContext.containsBean("redisKeyValueAdapter")).isFalse();
    }
}
