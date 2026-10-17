package com.pqc.core.controller;

import com.pqc.core.dto.*;
import com.pqc.core.service.Phase2QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/customer/orders/{orderId}/quotes")
public class CustomerQuoteController {
    private final Phase2QuoteService quotes;

    @GetMapping("/current")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerQuoteResponse> current(@PathVariable Long orderId) { return ResponseEntity.ok(quotes.current(orderId)); }

    @PostMapping("/{quoteId}/approve")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerQuoteResponse> approve(@PathVariable Long orderId, @PathVariable Long quoteId,
                                                         @RequestHeader(value = "Idempotency-Key", required = false) String key) { return ResponseEntity.ok(quotes.approve(orderId, quoteId, key)); }

    @PostMapping("/{quoteId}/reject")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerQuoteResponse> reject(@PathVariable Long orderId, @PathVariable Long quoteId,
                                                        @Valid @RequestBody QuoteRejectRequest request,
                                                        @RequestHeader(value = "Idempotency-Key", required = false) String key) { return ResponseEntity.ok(quotes.reject(orderId, quoteId, request, key)); }
}
