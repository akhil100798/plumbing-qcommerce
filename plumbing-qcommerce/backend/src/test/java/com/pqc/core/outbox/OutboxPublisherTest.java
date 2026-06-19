package com.pqc.core.outbox;

import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.entity.OutboxStatus;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.service.OutboxPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OutboxPublisherTest {

    private final OutboxEventRepository repository = mock(OutboxEventRepository.class);
    private final KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
    private final OutboxPublisher publisher = new OutboxPublisher(repository, kafka);

    @Test
    void kafkaFailureLeavesEventRetryable() {
        OutboxEvent event = pendingEvent();
        when(repository.findById(10L)).thenReturn(Optional.of(event));
        when(repository.save(any(OutboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(kafka.send(eq("order-created"), eq("order-10"), eq("{\"id\":10}")))
                .thenReturn(CompletableFuture.failedFuture(new TimeoutException("broker timeout")));

        publisher.publish(10L);

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(event.isProcessed()).isFalse();
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getLastError()).contains("broker timeout");
        assertThat(event.getNextAttemptAt()).isAfter(LocalDateTime.now().minusSeconds(1));
        verify(repository).save(event);
    }

    @Test
    void kafkaSuccessMarksEventPublishedOnlyAfterAcknowledgement() {
        OutboxEvent event = pendingEvent();
        when(repository.findById(10L)).thenReturn(Optional.of(event));
        when(repository.save(any(OutboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(kafka.send(eq("order-created"), eq("order-10"), eq("{\"id\":10}")))
                .thenReturn(CompletableFuture.completedFuture(null));

        publisher.publish(10L);

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        assertThat(event.isProcessed()).isTrue();
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getPublishedAt()).isNotNull();
        assertThat(event.getLastError()).isNull();
    }

    private OutboxEvent pendingEvent() {
        return OutboxEvent.builder()
                .id(10L)
                .aggregateId("order-10")
                .aggregateType("SERVICE_ORDER")
                .eventType("ORDER_CREATED")
                .topic("order-created")
                .payload("{\"id\":10}")
                .processed(false)
                .status(OutboxStatus.PENDING)
                .attempts(0)
                .nextAttemptAt(LocalDateTime.now().minusSeconds(1))
                .build();
    }
}
