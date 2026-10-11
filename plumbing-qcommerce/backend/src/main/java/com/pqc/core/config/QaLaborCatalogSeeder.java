package com.pqc.core.config;

import com.pqc.core.service.QaLaborCatalogFixtureService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Provisions only an explicitly configured QA labor catalog fixture. */
@Component
@Profile("!prod & (qa | staging)")
@ConditionalOnProperty(prefix = "app.seed.qa-labor-catalog", name = "enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class QaLaborCatalogSeeder implements CommandLineRunner {
    private static final String PREFIX = "app.seed.qa-labor-catalog.";
    private final Environment environment;
    private final QaLaborCatalogFixtureService fixtureService;

    @Override
    public void run(String... args) {
        QaLaborCatalogFixtureService.Fixture fixture = new QaLaborCatalogFixtureService.Fixture(
                required("key"), required("currency"), required("line-key"), decimal("amount"),
                required("unit"), decimal("min-quantity"), decimal("max-quantity"));
        if (!"INR".equalsIgnoreCase(fixture.currency().trim())) {
            throw new IllegalStateException("QA labor catalog currency must be INR");
        }
        fixtureService.ensureFixture(fixture);
    }

    private String required(String name) {
        String value = environment.getProperty(PREFIX + name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Required QA labor catalog fixture property is missing: " + PREFIX + name);
        }
        return value.trim();
    }

    private BigDecimal decimal(String name) {
        String value = required(name);
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("QA labor catalog fixture property must be numeric: " + PREFIX + name);
        }
    }
}
