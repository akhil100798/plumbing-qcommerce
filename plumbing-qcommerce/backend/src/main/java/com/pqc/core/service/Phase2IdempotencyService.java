package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.Phase2IdempotencyKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Duration;
import java.time.LocalDateTime;

@Service @RequiredArgsConstructor
public class Phase2IdempotencyService {
    private final Phase2IdempotencyKeyRepository repository;
    private final Phase2IdempotencyFinalizer finalizer;
    private final Phase2IdempotencyCompletionFaultInjector faultInjector;
    private final ThreadLocal<Phase2IdempotencyKey> currentClaim = new ThreadLocal<>();

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Phase2IdempotencyKey begin(Long actorId, String operation, String resourceType, Long resourceId, String key, String fingerprint) {
        int inserted = repository.claimIfAbsent(actorId, operation, resourceType, resourceId, key, fingerprint);
        // ON CONFLICT DO NOTHING leaves the transaction healthy. The lookup is
        // therefore a normal replay read, never recovery from a failed insert.
        Phase2IdempotencyKey result = repository.findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(actorId, operation, resourceType, resourceId, key)
                .map(existing -> inserted == 1 ? existing : validateReplay(existing, fingerprint))
                .orElseThrow(() -> new IllegalStateException("Idempotency claim disappeared"));
        if (inserted == 1) currentClaim.set(result);
        return result;
    }

    private Phase2IdempotencyKey validateReplay(Phase2IdempotencyKey existing, String fingerprint) {
        if (!existing.getRequestFingerprint().equals(fingerprint)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Idempotency key payload conflict");
        }
        if (existing.getStatus() == Phase2IdempotencyStatus.FAILED) {
            throw replayFailure(existing.getResponsePayload());
        }
        if (existing.getStatus() == Phase2IdempotencyStatus.IN_PROGRESS) {
            if (existing.getUpdatedAt() != null && existing.getUpdatedAt().isBefore(LocalDateTime.now().minus(Duration.ofMinutes(15)))) {
                finalizer.fail(existing.getId(), "409|OPERATION_STALE; use a new idempotency key");
                throw new ResponseStatusException(HttpStatus.CONFLICT, "OPERATION_STALE; use a new idempotency key");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "OPERATION_IN_PROGRESS");
        }
        return existing;
    }

    /** Must be called by a command participating in the business transaction. */
    @Transactional
    public void complete(Long id, String response) {
        faultInjector.beforeComplete(id, response);
        Phase2IdempotencyKey key = repository.findById(id).orElseThrow();
        key.setStatus(Phase2IdempotencyStatus.COMPLETED);
        key.setResponsePayload(response);
        repository.save(key);
        currentClaim.remove();
    }
    public void fail(Long id, String response) { finalizer.fail(id, response); }
    public void fail(Long id, Throwable failure) { fail(id, failurePayload(failure)); }
    public void failCurrent(Throwable failure) {
        Phase2IdempotencyKey key = currentClaim.get();
        if (key != null) {
            try { finalizer.fail(key.getId(), failurePayload(failure)); }
            finally { currentClaim.remove(); }
        }
    }
    private String failurePayload(Throwable failure) {
        if (failure instanceof ResponseStatusException r) {
            String reason = r.getReason() == null ? "Request failed" : r.getReason();
            return r.getStatusCode().value() + "|" + reason;
        }
        if (failure instanceof org.springframework.security.access.AccessDeniedException) return "403|Not authorized";
        return "500|Request failed";
    }
    private ResponseStatusException replayFailure(String payload) {
        try {
            String[] parts = payload.split("\\|", 2);
            return new ResponseStatusException(HttpStatus.valueOf(Integer.parseInt(parts[0])), parts.length == 2 ? parts[1] : "Request failed");
        } catch (Exception ignored) {
            return new ResponseStatusException(HttpStatus.CONFLICT, "Failed idempotency key is terminal");
        }
    }
}
