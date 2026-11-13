package com.pqc.core.repository;

import com.pqc.core.entity.ServiceQuoteEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceQuoteEventRepository extends JpaRepository<ServiceQuoteEvent, Long> {
    @Modifying
    @Query(value = "INSERT INTO service_quote_events (service_order_id, diagnosis_id, quote_id, aggregate_type, aggregate_id, transition_key, event_type, from_state, to_state, actor_id, actor_role, reason, idempotency_key_id, created_at) VALUES (:serviceOrderId, :diagnosisId, :quoteId, :aggregateType, :aggregateId, :transitionKey, :eventType, :fromState, :toState, :actorId, :actorRole, :reason, :idempotencyKeyId, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING", nativeQuery = true)
    int insertIfAbsent(@Param("serviceOrderId") Long serviceOrderId, @Param("diagnosisId") Long diagnosisId,
                       @Param("quoteId") Long quoteId, @Param("aggregateType") String aggregateType,
                       @Param("aggregateId") Long aggregateId, @Param("transitionKey") String transitionKey,
                       @Param("eventType") String eventType, @Param("fromState") String fromState,
                       @Param("toState") String toState, @Param("actorId") Long actorId,
                       @Param("actorRole") String actorRole, @Param("reason") String reason,
                       @Param("idempotencyKeyId") Long idempotencyKeyId);
    Optional<ServiceQuoteEvent> findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType(String aggregateType, Long aggregateId, String transitionKey, String eventType);
    Optional<ServiceQuoteEvent> findByIdempotencyKeyIdAndEventType(Long idempotencyKeyId, String eventType);
    List<ServiceQuoteEvent> findByQuoteIdOrderByCreatedAtAsc(Long quoteId);
}
