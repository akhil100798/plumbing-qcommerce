package com.pqc.core.service;

import org.springframework.stereotype.Component;

/** Production implementation: completion failure injection is unavailable. */
@Component
public class NoOpPhase2IdempotencyCompletionFaultInjector implements Phase2IdempotencyCompletionFaultInjector {
    @Override
    public void beforeComplete(Long id, String response) {
        // Intentionally empty in the production application.
    }
}
