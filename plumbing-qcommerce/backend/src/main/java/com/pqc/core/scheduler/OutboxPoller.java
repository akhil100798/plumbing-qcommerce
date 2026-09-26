package com.pqc.core.scheduler;

import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private static final long KAFKA_ACK_TIMEOUT_SECONDS = 10;

    private final OutboxEventRepository outboxRepository;
    private final ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider;
    private final ObjectProvider<com.pqc.core.document.AuditLogEventRepository> auditLogEventRepositoryProvider;

    @Scheduled(fixedDelay = 5000) // Poll every 5 seconds
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByProcessedFalseOrderByCreatedAtAsc();

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Found {} pending events in outbox. Starting publication...", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            // Do not acknowledge the outbox event until Kafka confirms the send.
            // Leaving failures unprocessed gives the next poll an at-least-once retry.
            if (!publishToKafka(event)) {
                continue;
            }

            // Kafka accepted the event. Persist the acknowledgement and optional audit log.
            try {
                event.setProcessed(true);
                outboxRepository.save(event);

                var mongoRepo = auditLogEventRepositoryProvider.getIfAvailable();
                if (mongoRepo != null) {
                    com.pqc.core.document.AuditLogEvent audit = com.pqc.core.document.AuditLogEvent.builder()
                            .aggregateId(event.getAggregateId())
                            .aggregateType(event.getAggregateType())
                            .eventType(event.getEventType())
                            .payload(event.getPayload())
                            .timestamp(java.time.LocalDateTime.now())
                            .build();
                    mongoRepo.save(audit);
                } else {
                    log.debug("MongoDB Audit Log Event repository is not configured. Skipping audit log persistence for event #{}.", event.getId());
                }

                log.info("Outbox event #{} processed and audit log persisted.", event.getId());
            } catch (Exception e) {
                log.error("Error persisting outbox event #{}: {}", event.getId(), e.getMessage());
            }
        }
    }

    private boolean publishToKafka(OutboxEvent event) {
        KafkaTemplate<String, String> kafkaTemplate = kafkaTemplateProvider.getIfAvailable();
        if (kafkaTemplate == null) {
            log.warn("Kafka template is not configured for outbox event #{}; leaving it unprocessed.", event.getId());
            return false;
        }

        try {
            CompletableFuture<?> sendFuture = kafkaTemplate.send(
                    event.getTopic(), event.getAggregateId(), event.getPayload());
            if (sendFuture == null) {
                log.error("Kafka returned no acknowledgement future for outbox event #{}; leaving it unprocessed.", event.getId());
                return false;
            }
            sendFuture.get(KAFKA_ACK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            log.debug("Successfully published event #{} to topic {}", event.getId(), event.getTopic());
            return true;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Interrupted while publishing outbox event #{}; leaving it unprocessed.", event.getId(), ex);
        } catch (ExecutionException | TimeoutException ex) {
            log.error("Failed to publish outbox event #{} to topic {}; leaving it unprocessed.",
                    event.getId(), event.getTopic(), ex);
        } catch (Exception ex) {
            log.error("Kafka send failed for outbox event #{} to topic {}; leaving it unprocessed.",
                    event.getId(), event.getTopic(), ex);
        }
        return false;
    }
}
