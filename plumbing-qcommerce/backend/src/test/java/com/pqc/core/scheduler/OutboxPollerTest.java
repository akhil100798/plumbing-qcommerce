package com.pqc.core.scheduler;

import com.pqc.core.document.AuditLogEventRepository;
import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxPollerTest {

    @Mock
    private OutboxEventRepository outboxRepository;

    @Mock
    private ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @Mock
    private ObjectProvider<AuditLogEventRepository> auditRepositoryProvider;

    private OutboxPoller poller;

    @BeforeEach
    void setUp() {
        poller = new OutboxPoller(outboxRepository, kafkaTemplateProvider, auditRepositoryProvider);
    }

    @Test
    void successfulKafkaSendMarksEventProcessed() {
        OutboxEvent event = event(1L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(event));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(kafkaTemplate);
        when(kafkaTemplate.send(anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));

        poller.pollAndPublish();

        assertThat(event.isProcessed()).isTrue();
        verify(outboxRepository).save(event);
    }

    @Test
    void failedKafkaSendLeavesEventUnprocessed() {
        OutboxEvent event = event(2L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(event));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(kafkaTemplate);
        when(kafkaTemplate.send(anyString(), anyString(), anyString()))
                .thenReturn(failedFuture(new IllegalStateException("broker unavailable")));

        poller.pollAndPublish();

        assertThat(event.isProcessed()).isFalse();
        verify(outboxRepository, never()).save(any(OutboxEvent.class));
    }

    @Test
    void failedEventIsSelectedAgainOnNextPollAndRetryCanSucceed() {
        OutboxEvent event = event(3L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(event), List.of(event));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(kafkaTemplate);
        when(kafkaTemplate.send(anyString(), anyString(), anyString()))
                .thenReturn(failedFuture(new RuntimeException("temporary failure")))
                .thenReturn(CompletableFuture.completedFuture(null));

        poller.pollAndPublish();
        assertThat(event.isProcessed()).isFalse();

        poller.pollAndPublish();

        assertThat(event.isProcessed()).isTrue();
        verify(kafkaTemplate, times(2)).send(anyString(), anyString(), anyString());
        verify(outboxRepository).save(event);
    }

    @Test
    void synchronousSendExceptionLeavesEventEligibleForRetry() {
        OutboxEvent event = event(4L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(event));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(kafkaTemplate);
        when(kafkaTemplate.send(anyString(), anyString(), anyString()))
                .thenThrow(new IllegalStateException("broker unavailable"));

        poller.pollAndPublish();

        assertThat(event.isProcessed()).isFalse();
        verify(outboxRepository, never()).save(any(OutboxEvent.class));
        verify(outboxRepository, never()).delete(any());
    }

    @Test
    void failedEventDoesNotPreventSuccessfulSiblingFromBeingProcessed() {
        OutboxEvent failed = event(5L);
        OutboxEvent successful = event(6L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(failed, successful));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(kafkaTemplate);
        when(kafkaTemplate.send(anyString(), anyString(), anyString()))
                .thenReturn(failedFuture(new RuntimeException("one event failed")))
                .thenReturn(CompletableFuture.completedFuture(null));

        poller.pollAndPublish();

        assertThat(failed.isProcessed()).isFalse();
        assertThat(successful.isProcessed()).isTrue();
        verify(outboxRepository).save(successful);
        verify(outboxRepository, never()).save(failed);
    }

    @Test
    void alreadyProcessedEventsAreNotSelectedOrResent() {
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of());

        poller.pollAndPublish();

        verifyNoInteractions(kafkaTemplateProvider);
        verify(outboxRepository, never()).save(any(OutboxEvent.class));
    }

    @Test
    void missingKafkaTemplateLeavesEventUnprocessed() {
        OutboxEvent event = event(7L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(event));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(null);

        poller.pollAndPublish();

        assertThat(event.isProcessed()).isFalse();
        verify(outboxRepository, never()).save(any(OutboxEvent.class));
    }

    @Test
    void sendFutureReturningNullDoesNotCreateFalseSuccess() {
        OutboxEvent event = event(8L);
        when(outboxRepository.findByProcessedFalseOrderByCreatedAtAsc()).thenReturn(List.of(event));
        when(kafkaTemplateProvider.getIfAvailable()).thenReturn(kafkaTemplate);
        when(kafkaTemplate.send(anyString(), anyString(), anyString())).thenReturn(null);

        poller.pollAndPublish();

        assertThat(event.isProcessed()).isFalse();
        verify(outboxRepository, never()).save(any(OutboxEvent.class));
    }

    private static OutboxEvent event(long id) {
        return OutboxEvent.builder()
                .id(id)
                .aggregateId(String.valueOf(id))
                .aggregateType("SERVICE_ORDER")
                .eventType("ORDER_CREATED")
                .topic("order-created")
                .payload("ORDER_CREATED:" + id)
                .processed(false)
                .build();
    }

    private static <T> CompletableFuture<T> failedFuture(Throwable failure) {
        CompletableFuture<T> future = new CompletableFuture<>();
        future.completeExceptionally(failure);
        return future;
    }
}
