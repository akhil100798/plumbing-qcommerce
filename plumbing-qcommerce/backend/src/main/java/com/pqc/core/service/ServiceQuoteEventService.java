package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ServiceQuoteEventService {
    private final ServiceQuoteEventRepository events;
    private final OutboxEventRepository outbox;

    /** Persist internal addendum audit history without producing an integration outbox event. */
    @Transactional
    public ServiceQuoteEvent recordAuditOnly(ServiceQuoteEvent event) {
        return events.save(event);
    }

    @Transactional
    public ServiceQuoteEvent record(ServiceQuoteEvent event, String topic, String payload) {
        if (event.getIdempotencyKeyId() != null) {
            ServiceQuoteEvent requestReplay = events.findByIdempotencyKeyIdAndEventType(event.getIdempotencyKeyId(), event.getEventType()).orElse(null);
            if (requestReplay != null) return requestReplay;
        }
        int inserted = events.insertIfAbsent(event.getServiceOrderId(), event.getDiagnosisId(), event.getQuoteId(),
                event.getAggregateType(), event.getAggregateId(), event.getTransitionKey(), event.getEventType(),
                event.getFromState(), event.getToState(), event.getActorId(), event.getActorRole(), event.getReason(), event.getIdempotencyKeyId());
        if (inserted == 0) {
            return event.getIdempotencyKeyId() == null
                    ? events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType(event.getAggregateType(), event.getAggregateId(), event.getTransitionKey(), event.getEventType()).orElseThrow()
                    : events.findByIdempotencyKeyIdAndEventType(event.getIdempotencyKeyId(), event.getEventType()).orElseGet(() -> events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType(event.getAggregateType(), event.getAggregateId(), event.getTransitionKey(), event.getEventType()).orElseThrow());
        }
        ServiceQuoteEvent saved = events.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType(event.getAggregateType(), event.getAggregateId(), event.getTransitionKey(), event.getEventType()).orElseThrow();
        outbox.save(OutboxEvent.builder().aggregateId(String.valueOf(event.getAggregateId())).aggregateType(event.getAggregateType()).eventType(event.getEventType()).topic(topic).payload(payload).processed(false).build());
        return saved;
    }
}
