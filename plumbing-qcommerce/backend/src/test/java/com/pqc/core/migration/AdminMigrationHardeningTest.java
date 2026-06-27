package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminMigrationHardeningTest {

    @Test
    void createsExpectedAdminIndexes() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setUrl("jdbc:h2:mem:admin_migration_hardening;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        dataSource.setUsername("sa");
        dataSource.setPassword("");

        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        assertTrue(indexExists(jdbcTemplate, "IDX_MARKETING_CAMPAIGNS_STATUS"), "Expected marketing campaign status index");
        assertTrue(indexExists(jdbcTemplate, "IDX_MARKETING_CAMPAIGNS_TARGET_SEGMENT"), "Expected marketing campaign segment index");
        assertTrue(indexExists(jdbcTemplate, "IDX_MARKETING_BANNERS_ACTIVE"), "Expected marketing banner active index");
        assertTrue(indexExists(jdbcTemplate, "IDX_MARKETING_NOTIFICATIONS_STATUS"), "Expected marketing notification status index");
        assertTrue(indexExists(jdbcTemplate, "IDX_MARKETING_NOTIFICATIONS_SENT_BY"), "Expected marketing notification sender index");
        assertTrue(indexExists(jdbcTemplate, "IDX_OFFERS_ACTIVE"), "Expected offers active index");
    }

    private boolean indexExists(JdbcTemplate jdbcTemplate, String indexName) {
        Integer matches = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.INDEXES WHERE UPPER(INDEX_NAME) = ?",
                Integer.class,
                indexName
        );
        return matches != null && matches > 0;
    }
}
