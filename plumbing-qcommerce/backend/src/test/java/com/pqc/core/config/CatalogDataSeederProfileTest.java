package com.pqc.core.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.mockito.Mockito;
import com.pqc.core.repository.*;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogDataSeederProfileTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(MockRepositoriesConfiguration.class)
            .withBean(PasswordEncoder.class, BCryptPasswordEncoder::new)
            .withBean(SeedProperties.class)
            .withBean(CatalogDataSeeder.class);

    @Test
    void whenLocalProfileAndSeederEnabled_shouldRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.catalog-enabled=true")
                .withSystemProperties("spring.profiles.active=local")
                .run(context -> {
                    assertThat(context).hasSingleBean(CatalogDataSeeder.class);
                });
    }

    @Test
    void whenLocalProfileAndSeederDisabled_shouldNotRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.catalog-enabled=false")
                .withSystemProperties("spring.profiles.active=local")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(CatalogDataSeeder.class);
                });
    }

    @Test
    void whenProdProfileAndSeederEnabled_shouldNotRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.catalog-enabled=true")
                .withSystemProperties("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(CatalogDataSeeder.class);
                });
    }

    @Test
    void whenMixedProdProfileAndSeederEnabled_shouldNotRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.catalog-enabled=true")
                .withSystemProperties("spring.profiles.active=prod,demo")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(CatalogDataSeeder.class);
                });
    }

    @Configuration
    static class MockRepositoriesConfiguration {
        @Bean CategoryRepository categoryRepository() { return Mockito.mock(CategoryRepository.class); }
        @Bean ProductRepository productRepository() { return Mockito.mock(ProductRepository.class); }
        @Bean StoreRepository storeRepository() { return Mockito.mock(StoreRepository.class); }
        @Bean UserRepository userRepository() { return Mockito.mock(UserRepository.class); }
        @Bean StockRepository stockRepository() { return Mockito.mock(StockRepository.class); }
    }
}
