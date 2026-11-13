package com.pqc.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "phase2-diagnosis-quotes")
public class Phase2Properties {
    private boolean enabled = false;
}
