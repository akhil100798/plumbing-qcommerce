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

    @Scheduled(fixedDelay = 5000) // Poll every 5 seconds
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByProcessedFalseOrderByCreatedAtAsc();

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Found {} pending events in outbox. Starting publication...", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                // Publish to Kafka
                kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.debug("Successfully published event #{} to topic {}", event.getId(), event.getTopic());
                            } else {
                                log.error("Failed to publish event #{} to topic {}", event.getId(), event.getTopic(), ex);
                            }
                        });

                // Mark as processed in the same transaction
                event.setProcessed(true);
                outboxRepository.save(event);
                
            } catch (Exception e) {
                log.error("Error processing outbox event #{}: {}", event.getId(), e.getMessage());
                // Event remains unprocessed for next poll
            }
        }
    }
}
