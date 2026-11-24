package com.pqc.core.service;

import com.pqc.core.entity.Phase2IdempotencyKey;
import com.pqc.core.entity.Phase2IdempotencyStatus;
import com.pqc.core.repository.Phase2IdempotencyKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Persists terminal idempotency outcomes outside the command transaction. */
@Service
@RequiredArgsConstructor
public class Phase2IdempotencyFinalizer {
    private final Phase2IdempotencyKeyRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void complete(Long id, String response) {
        update(id, Phase2IdempotencyStatus.COMPLETED, response);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void fail(Long id, String response) {
        update(id, Phase2IdempotencyStatus.FAILED, response);
    }

    private void update(Long id, Phase2IdempotencyStatus status, String response) {
        Phase2IdempotencyKey key = repository.findById(id).orElseThrow();
        key.setStatus(status);
        key.setResponsePayload(response);
        repository.save(key);
    }
}
