package com.pqc.core.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Conflict which must commit its internally-derived reconciliation snapshot. */
public class Phase2ReconciliationRequiredException extends ResponseStatusException {
    public Phase2ReconciliationRequiredException(String reason) {
        super(HttpStatus.CONFLICT, reason);
    }
}
