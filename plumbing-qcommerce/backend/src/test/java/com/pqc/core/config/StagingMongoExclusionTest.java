package com.pqc.core.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.pqc.core.scheduler.OutboxPoller;
import com.pqc.core.service.DemandForecastService;
import com.pqc.core.service.ServiceLogService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest
@ActiveProfiles({"staging", "test"})
@TestPropertySource(properties = {
        "spring.data.redis.host=",
        "features.delivery-enabled=false",
        "app.seed.staging-admin.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.data.mongodb.autoconfigure.DataMongoAutoConfiguration,org.springframework.boot.mongodb.autoconfigure.MongoAutoConfiguration,org.springframework.boot.data.mongodb.autoconfigure.DataMongoRepositoriesAutoConfiguration,org.springframework.boot.kafka.autoconfigure.KafkaAutoConfiguration,org.springframework.boot.data.redis.autoconfigure.DataRedisAutoConfiguration,org.springframework.boot.data.redis.autoconfigure.DataRedisRepositoriesAutoConfiguration,org.springframework.boot.data.redis.autoconfigure.DataRedisReactiveAutoConfiguration"
})
class StagingMongoExclusionTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private ServiceLogService serviceLogService;

    @Autowired
    private DemandForecastService demandForecastService;

    @Autowired
    private OutboxPoller outboxPoller;

    @Test
    @DisplayName("MongoRepositoryConfig is excluded under staging profile")
    void test_mongoRepositoryConfigExcludedUnderStaging() {
        assertThat(applicationContext.containsBean("mongoRepositoryConfig")).isFalse();
    }

    @Test
    @DisplayName("MongoDB repositories and template are absent under staging profile")
    void test_mongoBeansAbsentUnderStaging() {
        assertThat(applicationContext.containsBean("auditLogEventRepository")).isFalse();
        assertThat(applicationContext.containsBean("serviceLogRepository")).isFalse();
        assertThat(applicationContext.containsBean("mongoTemplate")).isFalse();
        assertThat(applicationContext.containsBean("mongoClient")).isFalse();
    }

    @Test
    @DisplayName("Services depending on optional Mongo repositories operate gracefully without failure")
    void test_servicesOperateCleanlyWithoutMongo() {
        assertThatCode(() -> serviceLogService.getLogsByOrder(999L)).doesNotThrowAnyException();
        assertThat(serviceLogService.getLogsByOrder(999L)).isEmpty();
        assertThat(serviceLogService.getLogsByPlumber(999L)).isEmpty();

        assertThatCode(() -> outboxPoller.pollAndPublish()).doesNotThrowAnyException();
    }
}
