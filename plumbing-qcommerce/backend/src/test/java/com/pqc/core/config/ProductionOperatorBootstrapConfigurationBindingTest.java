package com.pqc.core.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ProductionOperatorBootstrapConfigurationBindingTest {

    @Test
    @DisplayName("Verify Spring relaxed binding from environment variable names to properties")
    void testRelaxedBindingFromEnvVars() {
        Map<String, Object> envMap = new HashMap<>();
        envMap.put("FIXKART_BOOTSTRAP_ADMIN_ENABLED", "true");
        envMap.put("FIXKART_BOOTSTRAP_ADMIN_EMAIL", "test.admin@fixkart.com");
        envMap.put("FIXKART_BOOTSTRAP_ADMIN_PASSWORD", "SuperSecurePassword123!");
        envMap.put("FIXKART_BOOTSTRAP_ADMIN_NAME", "Ops Admin");
        envMap.put("FIXKART_BOOTSTRAP_ADMIN_ROLE", "ADMIN");

        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource("testEnv", envMap));

        Iterable<org.springframework.boot.context.properties.source.ConfigurationPropertySource> sources =
                ConfigurationPropertySources.get(environment);
        Binder binder = new Binder(sources);

        ProductionOperatorBootstrapProperties properties = binder
                .bind("fixkart.bootstrap.admin", Bindable.of(ProductionOperatorBootstrapProperties.class))
                .orElse(null);

        assertNotNull(properties, "Properties should bind successfully from environment variables");
        assertTrue(properties.isEnabled());
        assertEquals("test.admin@fixkart.com", properties.getEmail());
        assertEquals("SuperSecurePassword123!", properties.getPassword());
        assertEquals("Ops Admin", properties.getName());
        assertEquals("ADMIN", properties.getRole());
    }

    @Test
    @DisplayName("Verify property source binding using standard dotted notation")
    void testDottedPropertyBinding() {
        Map<String, Object> propMap = new HashMap<>();
        propMap.put("fixkart.bootstrap.admin.enabled", "true");
        propMap.put("fixkart.bootstrap.admin.email", "admin@fixkart.com");
        propMap.put("fixkart.bootstrap.admin.password", "Pass123456!");

        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("testProps", propMap));

        Iterable<org.springframework.boot.context.properties.source.ConfigurationPropertySource> sources =
                ConfigurationPropertySources.get(environment);
        Binder binder = new Binder(sources);

        ProductionOperatorBootstrapProperties properties = binder
                .bind("fixkart.bootstrap.admin", Bindable.of(ProductionOperatorBootstrapProperties.class))
                .orElse(null);

        assertNotNull(properties);
        assertTrue(properties.isEnabled());
        assertEquals("admin@fixkart.com", properties.getEmail());
        assertEquals("Pass123456!", properties.getPassword());
    }

    @Test
    @DisplayName("Verify default configuration when properties are absent")
    void testDefaultValuesWhenAbsent() {
        StandardEnvironment environment = new StandardEnvironment();
        Iterable<org.springframework.boot.context.properties.source.ConfigurationPropertySource> sources =
                ConfigurationPropertySources.get(environment);
        Binder binder = new Binder(sources);

        ProductionOperatorBootstrapProperties properties = binder
                .bind("fixkart.bootstrap.admin", Bindable.of(ProductionOperatorBootstrapProperties.class))
                .orElseGet(ProductionOperatorBootstrapProperties::new);

        assertNotNull(properties);
        assertFalse(properties.isEnabled(), "Default must be disabled");
        assertNull(properties.getEmail());
        assertNull(properties.getPassword());
        assertEquals("ADMIN", properties.getRole());
    }
}
