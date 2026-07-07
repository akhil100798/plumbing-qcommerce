package com.pqc.core.migration;

import com.pqc.core.entity.Role;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserRoleConstraintMigrationTest {

    @Test
    void migratesToV10WithAllCurrentRolesInConstraintDefinition() throws IOException {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setUrl("jdbc:h2:mem:user_role_constraint;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        dataSource.setUsername("sa");
        dataSource.setPassword("");

        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        String currentVersion = jdbcTemplate.queryForObject(
                "SELECT version FROM flyway_schema_history WHERE success = TRUE ORDER BY installed_rank DESC LIMIT 1",
                String.class
        );
        assertNotNull(currentVersion);
        assertTrue(Integer.parseInt(currentVersion) >= 10, "Expected migrations to include at least V10");

        String migrationSql = new String(
                getClass().getClassLoader()
                        .getResourceAsStream("db/migration/V10__expand_users_role_check_for_admin_roles.sql")
                        .readAllBytes(),
                StandardCharsets.UTF_8
        );
        for (Role role : Role.values()) {
            assertTrue(migrationSql.contains("'" + role.name() + "'"), () -> "Expected V10 migration to include role " + role.name());
        }
    }
}
