package com.pqc.core.config;

import java.lang.management.ManagementFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

@Configuration
public class StartupEventListener {

    private static final Logger log = LoggerFactory.getLogger(StartupEventListener.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        log.info("[STARTUP] Application ready and listening for HTTP requests in {} ms ({} s)", uptimeMs, String.format("%.2f", uptimeMs / 1000.0));
    }
}
