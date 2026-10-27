package com.pqc.core.config;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class DataSourceConfigTest {

    @Test
    void dataSource_bindsHikariPropertiesFromEnvironment() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.datasource.hikari.maximum-pool-size", "15");
        env.setProperty("spring.datasource.hikari.minimum-idle", "3");
        env.setProperty("spring.datasource.hikari.pool-name", "TestBoundHikariPool");
        env.setProperty("spring.datasource.hikari.connection-timeout", "20000");
        env.setProperty("spring.datasource.hikari.idle-timeout", "300000");
        env.setProperty("spring.datasource.hikari.max-lifetime", "1200000");
        env.setProperty("spring.datasource.hikari.keepalive-time", "45000");
        env.setProperty("spring.datasource.hikari.leak-detection-threshold", "50000");

        DataSourceConfig config = new DataSourceConfig(env);
        ReflectionTestUtils.setField(config, "rawUrl", "jdbc:postgresql://localhost:5432/testdb");
        ReflectionTestUtils.setField(config, "rawUsername", "testuser");
        ReflectionTestUtils.setField(config, "rawPassword", "testpass");

        HikariDataSource ds = config.dataSource();

        assertThat(ds.getMaximumPoolSize()).isEqualTo(15);
        assertThat(ds.getMinimumIdle()).isEqualTo(3);
        assertThat(ds.getPoolName()).isEqualTo("TestBoundHikariPool");
        assertThat(ds.getConnectionTimeout()).isEqualTo(20000);
        assertThat(ds.getIdleTimeout()).isEqualTo(300000);
        assertThat(ds.getMaxLifetime()).isEqualTo(1200000);
        assertThat(ds.getKeepaliveTime()).isEqualTo(45000);
        assertThat(ds.getLeakDetectionThreshold()).isEqualTo(50000);
        assertThat(ds.getJdbcUrl()).isEqualTo("jdbc:postgresql://localhost:5432/testdb");
        assertThat(ds.getUsername()).isEqualTo("testuser");
        assertThat(ds.getPassword()).isEqualTo("testpass");
    }

    @Test
    void dataSource_parsesRenderPostgresUrlCorrectly() {
        MockEnvironment env = new MockEnvironment();
        DataSourceConfig config = new DataSourceConfig(env);
        ReflectionTestUtils.setField(config, "rawUrl", "postgresql://render_user:super_secret@dpg-c12345:5432/render_db");
        ReflectionTestUtils.setField(config, "rawUsername", "fallback_user");
        ReflectionTestUtils.setField(config, "rawPassword", "fallback_pass");

        HikariDataSource ds = config.dataSource();

        assertThat(ds.getJdbcUrl()).isEqualTo("jdbc:postgresql://dpg-c12345.oregon-postgres.render.com:5432/render_db");
        assertThat(ds.getUsername()).isEqualTo("render_user");
        assertThat(ds.getPassword()).isEqualTo("super_secret");
    }

    @Test
    void dataSource_handlesNullEnvironmentGracefully() {
        DataSourceConfig config = new DataSourceConfig(null);
        ReflectionTestUtils.setField(config, "rawUrl", "jdbc:postgresql://localhost:5432/testdb");
        ReflectionTestUtils.setField(config, "rawUsername", "testuser");
        ReflectionTestUtils.setField(config, "rawPassword", "testpass");

        HikariDataSource ds = config.dataSource();
        assertThat(ds.getJdbcUrl()).isEqualTo("jdbc:postgresql://localhost:5432/testdb");
    }
}
