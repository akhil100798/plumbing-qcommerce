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

class AdminDemoDataSeederProfileTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(MockRepositoriesConfiguration.class)
            .withBean(PasswordEncoder.class, BCryptPasswordEncoder::new)
            .withBean(SeedProperties.class)
            .withBean(AdminDemoDataSeeder.class);

    @Test
    void whenLocalProfileAndSeederEnabled_shouldRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.admin-demo-enabled=true")
                .withSystemProperties("spring.profiles.active=local")
                .run(context -> {
                    assertThat(context).hasSingleBean(AdminDemoDataSeeder.class);
                });
    }

    @Test
    void whenLocalProfileAndSeederDisabled_shouldNotRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.admin-demo-enabled=false")
                .withSystemProperties("spring.profiles.active=local")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(AdminDemoDataSeeder.class);
                });
    }

    @Test
    void whenProdProfileAndSeederEnabled_shouldNotRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.admin-demo-enabled=true")
                .withSystemProperties("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(AdminDemoDataSeeder.class);
                });
    }

    @Test
    void whenMixedProdProfileAndSeederEnabled_shouldNotRegisterBean() {
        this.contextRunner
                .withPropertyValues("app.seed.admin-demo-enabled=true")
                .withSystemProperties("spring.profiles.active=prod,demo")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(AdminDemoDataSeeder.class);
                });
    }

    @Configuration
    static class MockRepositoriesConfiguration {
        @Bean UserRepository userRepository() { return Mockito.mock(UserRepository.class); }
        @Bean StoreRepository storeRepository() { return Mockito.mock(StoreRepository.class); }
        @Bean ProductRepository productRepository() { return Mockito.mock(ProductRepository.class); }
        @Bean ProductOrderRepository productOrderRepository() { return Mockito.mock(ProductOrderRepository.class); }
        @Bean ServiceOrderRepository serviceOrderRepository() { return Mockito.mock(ServiceOrderRepository.class); }
        @Bean WalletRepository walletRepository() { return Mockito.mock(WalletRepository.class); }
        @Bean SettlementRepository settlementRepository() { return Mockito.mock(SettlementRepository.class); }
        @Bean RefundRequestRepository refundRequestRepository() { return Mockito.mock(RefundRequestRepository.class); }
        @Bean SupportTicketRepository supportTicketRepository() { return Mockito.mock(SupportTicketRepository.class); }
        @Bean SupportMessageRepository supportMessageRepository() { return Mockito.mock(SupportMessageRepository.class); }
        @Bean PlumberKycRepository plumberKycRepository() { return Mockito.mock(PlumberKycRepository.class); }
        @Bean OfferRepository offerRepository() { return Mockito.mock(OfferRepository.class); }
        @Bean MarketingCampaignRepository marketingCampaignRepository() { return Mockito.mock(MarketingCampaignRepository.class); }
        @Bean MarketingBannerRepository marketingBannerRepository() { return Mockito.mock(MarketingBannerRepository.class); }
        @Bean MarketingNotificationRepository marketingNotificationRepository() { return Mockito.mock(MarketingNotificationRepository.class); }
    }
}
