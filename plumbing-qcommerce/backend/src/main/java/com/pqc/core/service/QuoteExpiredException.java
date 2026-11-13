package com.pqc.core.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** A rejected decision which must not roll back the lazy expiry transition. */
public class QuoteExpiredException extends ResponseStatusException {
    public QuoteExpiredException() {
        super(HttpStatus.CONFLICT, "Quote has expired");
    }
}
