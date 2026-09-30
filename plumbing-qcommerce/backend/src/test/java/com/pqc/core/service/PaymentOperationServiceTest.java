package com.pqc.core.service;

import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.repository.PaymentOperationRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PaymentOperationServiceTest {
    private final PaymentOperationRepository repository = mock(PaymentOperationRepository.class);
    private final PaymentOperationService service = new PaymentOperationService(repository);

    @Test
    void captureClaimIsAcquiredOnlyOnce() {
        PaymentOperation operation = PaymentOperation.builder().id(1L).serviceOrderId(7L)
                .purpose(PaymentOperationService.PURPOSE).idempotencyKey("service-order:7:capture:v1")
                .status(PaymentOperationStatus.INITIATED).amount(new BigDecimal("10.00")).currency("INR").build();
        when(repository.findForUpdate(7L, PaymentOperationService.PURPOSE)).thenReturn(Optional.of(operation));
        when(repository.saveAndFlush(operation)).thenReturn(operation);

        PaymentOperationService.CaptureClaim first = service.claimCapture(operation);
        operation.setStatus(PaymentOperationStatus.CAPTURE_IN_PROGRESS);
        PaymentOperationService.CaptureClaim second = service.claimCapture(operation);

        assertThat(first.acquired()).isTrue();
        assertThat(second.acquired()).isFalse();
        verify(repository, times(1)).saveAndFlush(operation);
    }

    @Test
    void reconciliationStateIsNotRetryableByClaim() {
        PaymentOperation operation = PaymentOperation.builder().id(2L).serviceOrderId(8L)
                .purpose(PaymentOperationService.PURPOSE).status(PaymentOperationStatus.REQUIRES_RECONCILIATION)
                .amount(new BigDecimal("10.00")).currency("INR").build();
        when(repository.findForUpdate(8L, PaymentOperationService.PURPOSE)).thenReturn(Optional.of(operation));

        PaymentOperationService.CaptureClaim claim = service.claimCapture(operation);

        assertThat(claim.acquired()).isFalse();
        assertThat(claim.operation().getStatus()).isEqualTo(PaymentOperationStatus.REQUIRES_RECONCILIATION);
    }

    @Test
    void concurrentClaimsAllowOnlyOneCaptureOwner() throws Exception {
        PaymentOperation operation = PaymentOperation.builder().id(3L).serviceOrderId(9L)
                .purpose(PaymentOperationService.PURPOSE).status(PaymentOperationStatus.INITIATED)
                .amount(new BigDecimal("10.00")).currency("INR").build();
        AtomicInteger queries = new AtomicInteger();
        when(repository.findForUpdate(9L, PaymentOperationService.PURPOSE)).thenAnswer(invocation -> {
            if (queries.getAndIncrement() == 0) {
                PaymentOperation firstRead = PaymentOperation.builder()
                        .id(operation.getId()).serviceOrderId(operation.getServiceOrderId())
                        .purpose(operation.getPurpose()).idempotencyKey(operation.getIdempotencyKey())
                        .status(PaymentOperationStatus.INITIATED).amount(operation.getAmount())
                        .currency(operation.getCurrency()).build();
                operation.setStatus(PaymentOperationStatus.CAPTURE_IN_PROGRESS);
                return Optional.of(firstRead);
            }
            return Optional.of(operation);
        });
        when(repository.saveAndFlush(any(PaymentOperation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        int workers = 2;
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch finish = new CountDownLatch(workers);
        AtomicInteger acquired = new AtomicInteger();
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        for (int i = 0; i < workers; i++) {
            executor.submit(() -> {
                try {
                    start.await();
                    if (service.claimCapture(operation).acquired()) acquired.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    finish.countDown();
                }
            });
        }
        start.countDown();
        assertThat(finish.await(5, TimeUnit.SECONDS)).isTrue();
        executor.shutdownNow();

        assertThat(acquired).hasValue(1);
    }
}
