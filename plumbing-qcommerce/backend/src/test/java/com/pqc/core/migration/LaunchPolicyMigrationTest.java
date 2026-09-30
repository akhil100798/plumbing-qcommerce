package com.pqc.core.migration;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class LaunchPolicyMigrationTest {
    @Test
    void v24IsStrictAndContainsRequiredSchemaGuards() throws Exception {
        String sql = new String(new ClassPathResource(
                "db/migration/V24__add_launch_policy_foundation.sql").getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);

        assertThat(sql).doesNotContain("CREATE TABLE IF NOT EXISTS");
        assertThat(sql).contains("CREATE TABLE launch_policies");
        assertThat(sql).contains("CREATE TABLE launch_plumber_roster");
        assertThat(sql).contains("CREATE TABLE payment_operations");
        assertThat(sql).contains("REFERENCES stores(id)", "REFERENCES users(id)", "REFERENCES service_orders(id)");
        assertThat(sql).contains("uq_launch_roster_policy_plumber", "idx_launch_roster_plumber");
        assertThat(sql).contains("ck_launch_policy_currency_format");
        assertThat(sql).contains("ck_launch_policy_store_when_enforced");
        assertThat(sql).contains("ck_launch_policy_area_complete");
        assertThat(sql).contains("ck_payment_operation_status");
    }
}
