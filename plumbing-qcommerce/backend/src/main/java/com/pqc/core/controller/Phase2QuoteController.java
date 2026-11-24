package com.pqc.core.controller;

import com.pqc.core.dto.*;
import com.pqc.core.service.Phase2QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/orders/{orderId}/quotes")
public class Phase2QuoteController {
    private final Phase2QuoteService quotes;

    @GetMapping("/{quoteId}")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberQuoteResponse> read(@PathVariable Long orderId, @PathVariable Long quoteId) { return ResponseEntity.ok(quotes.plumberRead(orderId, quoteId)); }

    @GetMapping("/current")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberQuoteResponse> current(@PathVariable Long orderId) {
        return ResponseEntity.ok(quotes.currentForPlumber(orderId));
    }

    @PatchMapping("/{quoteId}")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberQuoteResponse> update(@PathVariable Long orderId, @PathVariable Long quoteId,
                                                       @Valid @RequestBody QuoteDraftUpdateRequest request,
                                                       @RequestHeader(value = "Idempotency-Key", required = false) String key) { return ResponseEntity.ok(quotes.updateDraft(orderId, quoteId, request, key)); }

    @PostMapping("/{quoteId}/publish")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberQuoteResponse> publish(@PathVariable Long orderId, @PathVariable Long quoteId,
                                                        @RequestBody(required = false) QuotePublishRequest request,
                                                        @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(quotes.publish(orderId, quoteId, request, key));
    }

    @PostMapping("/{quoteId}/revise")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberQuoteResponse> revise(@PathVariable Long orderId, @PathVariable Long quoteId,
                                                       @RequestBody(required = false) QuoteRevisionRequest request,
                                                       @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(quotes.revise(orderId, quoteId, request, key));
    }
}
