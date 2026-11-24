package com.pqc.core.config;

import com.pqc.core.service.QaLaborCatalogFixtureService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class QaLaborCatalogSeederProfileTest {

    private final QaLaborCatalogFixtureService fixtureService = mock(QaLaborCatalogFixtureService.class);

    private ApplicationContextRunner runner() {
        return new ApplicationContextRunner()
                .withBean(QaLaborCatalogFixtureService.class, () -> fixtureService)
                .withBean(QaLaborCatalogSeeder.class);
    }

    @Test
    @DisplayName("Bean does NOT load when profile is prod only (even if property is enabled)")
    void doesNotLoadOnProdOnly() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=true")
                .withSystemProperties("spring.profiles.active=prod")
                .run(context -> assertThat(context).doesNotHaveBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean loads when profile is staging only and property is enabled")
    void loadsOnStagingOnly() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=true")
                .withSystemProperties("spring.profiles.active=staging")
                .run(context -> assertThat(context).hasSingleBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean loads when profile is qa only and property is enabled")
    void loadsOnQaOnly() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=true")
                .withSystemProperties("spring.profiles.active=qa")
                .run(context -> assertThat(context).hasSingleBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean loads on Render staging topology (prod,staging) when property is enabled")
    void loadsOnProdStagingTopology() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=true")
                .withSystemProperties("spring.profiles.active=prod,staging")
                .run(context -> assertThat(context).hasSingleBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean loads on prod,qa when property is enabled")
    void loadsOnProdQaTopology() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=true")
                .withSystemProperties("spring.profiles.active=prod,qa")
                .run(context -> assertThat(context).hasSingleBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean does NOT load when no profile is active (default)")
    void doesNotLoadOnDefaultProfile() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=true")
                .run(context -> assertThat(context).doesNotHaveBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean does NOT load on prod,staging when property is unset")
    void doesNotLoadWhenPropertyUnset() {
        runner()
                .withSystemProperties("spring.profiles.active=prod,staging")
                .run(context -> assertThat(context).doesNotHaveBean(QaLaborCatalogSeeder.class));
    }

    @Test
    @DisplayName("Bean does NOT load on prod,staging when property is explicitly false")
    void doesNotLoadWhenPropertyFalse() {
        runner()
                .withPropertyValues("app.seed.qa-labor-catalog.enabled=false")
                .withSystemProperties("spring.profiles.active=prod,staging")
                .run(context -> assertThat(context).doesNotHaveBean(QaLaborCatalogSeeder.class));
    }
}
