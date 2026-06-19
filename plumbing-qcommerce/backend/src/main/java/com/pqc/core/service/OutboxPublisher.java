package com.pqc.core.service;

import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.entity.OutboxStatus;
import com.pqc.core.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private static final long ACK_TIMEOUT_SECONDS = 10;

    private final OutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public void publish(Long eventId) {
        OutboxEvent event = outboxRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Outbox event not found: " + eventId));
        if (event.getStatus() == OutboxStatus.PUBLISHED || event.getStatus() == OutboxStatus.DEAD_LETTER) {
            return;
        }

        event.setAttempts(event.getAttempts() + 1);
        try {
            kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
                    .get(ACK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            event.setStatus(OutboxStatus.PUBLISHED);
            event.setProcessed(true);
            event.setPublishedAt(LocalDateTime.now());
            event.setLastError(null);
            outboxRepository.save(event);
            log.debug("Published outbox event #{} to {}", event.getId(), event.getTopic());
        } catch (Exception ex) {
            Throwable cause = rootCause(ex);
            event.setProcessed(false);
            event.setLastError(cause.getMessage());
            if (event.getAttempts() >= event.getMaxAttempts()) {
                event.setStatus(OutboxStatus.DEAD_LETTER);
            } else {
                event.setStatus(OutboxStatus.PENDING);
                event.setNextAttemptAt(nextAttempt(event.getAttempts()));
            }
            outboxRepository.save(event);
            log.warn("Outbox event #{} publish attempt {} failed: {}",
                    event.getId(), event.getAttempts(), event.getLastError());
        }
    }

    private LocalDateTime nextAttempt(int attempts) {
        long delaySeconds = Math.min(300, (long) Math.pow(2, attempts));
        return LocalDateTime.now().plusSeconds(delaySeconds);
    }

    private Throwable rootCause(Exception ex) {
        if (ex instanceof ExecutionException executionException && executionException.getCause() != null) {
            return executionException.getCause();
        }
        return ex;
    }
}
