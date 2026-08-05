package com.pqc.core.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class VersionController {

    private static final String BUILD_TIME = Instant.now().toString();

    @GetMapping("/version")
    public ResponseEntity<Map<String, Object>> getVersion() {
        String branch = System.getenv().getOrDefault("RENDER_GIT_BRANCH", "Development");
        String commit = System.getenv().getOrDefault("RENDER_GIT_COMMIT", System.getenv().getOrDefault("GIT_COMMIT", "d4185a3df63053e3ae0b0eee0ad72e131b860d81"));
        return ResponseEntity.ok(Map.of(
                "application", "FixKart Backend",
                "version", "1.0.0",
                "branch", branch,
                "commit", commit,
                "buildTime", BUILD_TIME
        ));
    }
}
