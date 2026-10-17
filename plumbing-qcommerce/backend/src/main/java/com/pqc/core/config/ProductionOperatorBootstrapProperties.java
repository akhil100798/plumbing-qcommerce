package com.pqc.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "fixkart.bootstrap.admin")
@Data
public class ProductionOperatorBootstrapProperties {
    private boolean enabled = false;
    private String email;
    private String password;
    private String name = "Initial Production Administrator";
    private String phone = "5555500001";
    private String role = "ADMIN";
}
