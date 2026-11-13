package com.pqc.core.service;

/** Internal seam for test-only completion failure injection. */
public interface Phase2IdempotencyCompletionFaultInjector {
    void beforeComplete(Long id, String response);
}
