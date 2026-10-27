package com.pqc.core.controller;

import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final ApplicationAvailability availability;
    private final DataSource dataSource;

    public HealthController(ApplicationAvailability availability, DataSource dataSource) {
        this.availability = availability;
        this.dataSource = dataSource;
    }

    @GetMapping("/live")
    public ResponseEntity<Map<String, Object>> live() {
        boolean isLive = availability != null && availability.getLivenessState() == LivenessState.CORRECT;
        HttpStatus status = isLive ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(Map.of(
                "status", isLive ? "UP" : "DOWN",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> ready() {
        boolean acceptingTraffic = availability != null && availability.getReadinessState() == ReadinessState.ACCEPTING_TRAFFIC;
        boolean dbHealthy = false;
        if (acceptingTraffic && dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                dbHealthy = conn.isValid(2);
            } catch (Exception ignored) {
                dbHealthy = false;
            }
        }
        boolean isReady = acceptingTraffic && dbHealthy;
        HttpStatus status = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(Map.of(
                "status", isReady ? "UP" : "OUT_OF_SERVICE",
                "timestamp", Instant.now().toString()
        ));
    }
}
