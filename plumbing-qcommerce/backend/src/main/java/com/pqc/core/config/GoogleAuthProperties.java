package com.pqc.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "google.auth")
@Data
public class GoogleAuthProperties {
    private boolean enabled = false;
    private String webClientId;
    private String androidClientId;
    private String iosClientId;
    private List<String> allowedClientIds;
}
