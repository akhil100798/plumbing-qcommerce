package com.pqc.core.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Redundant E2E data seeder, logic consolidated into StagingDemoMobileUserSeeder.java.
 * This bean is deactivated via profile to prevent duplicate data seeding.
 */
@Component
@Profile("disabled-redundant-seeder")
public class StagingMobileE2eDataSeeder implements CommandLineRunner {
    @Override
    public void run(String... args) {
        // No-op: consolidated into StagingDemoMobileUserSeeder
    }
}
