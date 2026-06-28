package com.pqc.core.config;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class FlywayConfig {

    @Bean(initMethod = "migrate")
    public Flyway flyway(
            DataSource dataSource,
            @Value("${app.flyway.baseline-on-migrate:true}") boolean baselineOnMigrate) {
        return Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(baselineOnMigrate)
                .locations("classpath:db/migration")
                .load();
    }

    @Bean
    public static BeanFactoryPostProcessor entityManagerFactoryDependsOnFlywayPostProcessor() {
        return beanFactory -> addDependsOnFlyway(beanFactory, "entityManagerFactory");
    }

    private static void addDependsOnFlyway(ConfigurableListableBeanFactory beanFactory, String beanName) {
        if (!(beanFactory instanceof BeanDefinitionRegistry registry) || !registry.containsBeanDefinition(beanName)) {
            return;
        }

        var beanDefinition = registry.getBeanDefinition(beanName);
        var existingDependsOn = beanDefinition.getDependsOn();
        if (existingDependsOn == null || existingDependsOn.length == 0) {
            beanDefinition.setDependsOn("flyway");
            return;
        }

        for (String dependency : existingDependsOn) {
            if ("flyway".equals(dependency)) {
                return;
            }
        }

        String[] updatedDependsOn = new String[existingDependsOn.length + 1];
        System.arraycopy(existingDependsOn, 0, updatedDependsOn, 0, existingDependsOn.length);
        updatedDependsOn[existingDependsOn.length] = "flyway";
        beanDefinition.setDependsOn(updatedDependsOn);
    }
}
