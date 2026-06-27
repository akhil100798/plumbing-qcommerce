package com.pqc.core.scheduler;

import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final com.pqc.core.document.AuditLogEventRepository auditLogEventRepository;

    @Scheduled(fixedDelay = 5000) // Poll every 5 seconds
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByProcessedFalseOrderByCreatedAtAsc();

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Found {} pending events in outbox. Starting publication...", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            // Step 1: Attempt Kafka publish (best-effort — failure does NOT block audit/mark)
            try {
                kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.debug("Successfully published event #{} to topic {}", event.getId(), event.getTopic());
                            } else {
                                log.error("Failed to publish event #{} to topic {}", event.getId(), event.getTopic(), ex);
                            }
                        });
            } catch (Exception kafkaEx) {
                log.warn("Kafka unavailable for event #{} ({}): {}. Proceeding with audit/mark.", 
                        event.getId(), event.getTopic(), kafkaEx.getMessage());
            }

            // Step 2: Always mark as processed and write MongoDB audit log
            try {
                event.setProcessed(true);
                outboxRepository.save(event);

                com.pqc.core.document.AuditLogEvent audit = com.pqc.core.document.AuditLogEvent.builder()
                        .aggregateId(event.getAggregateId())
                        .aggregateType(event.getAggregateType())
                        .eventType(event.getEventType())
                        .payload(event.getPayload())
                        .timestamp(java.time.LocalDateTime.now())
                        .build();
                auditLogEventRepository.save(audit);

                log.info("Outbox event #{} processed and audit log persisted.", event.getId());
            } catch (Exception e) {
                log.error("Error persisting outbox event #{}: {}", event.getId(), e.getMessage());
            }
        }
    }
}
