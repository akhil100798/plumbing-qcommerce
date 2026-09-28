package com.pqc.core.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class PublicConfigController {

    @Value("${fixkart.support.email:${FIXKART_SUPPORT_EMAIL:#{null}}}")
    private String supportEmail;

    @Value("${fixkart.support.phone:${FIXKART_SUPPORT_PHONE:#{null}}}")
    private String supportPhone;

    @GetMapping({"/config/public", "/support/contact"})
    public ResponseEntity<Map<String, String>> getPublicConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("email", (supportEmail != null && !supportEmail.isBlank()) ? supportEmail : null);
        config.put("phone", (supportPhone != null && !supportPhone.isBlank()) ? supportPhone : null);
        config.put("appName", "FixKart Store Partner");
        config.put("helpline", (supportPhone != null && !supportPhone.isBlank()) ? supportPhone : null);
        return ResponseEntity.ok(config);
    }
}
