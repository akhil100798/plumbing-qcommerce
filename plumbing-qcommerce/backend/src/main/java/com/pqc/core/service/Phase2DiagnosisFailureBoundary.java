package com.pqc.core.service;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Runs outside the transactional service interceptor so rollback precedes FAILED finalization. */
@Aspect
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
@RequiredArgsConstructor
public class Phase2DiagnosisFailureBoundary {
    private final Phase2IdempotencyService idempotency;

    @Around("execution(public * com.pqc.core.service.ServiceDiagnosisService.create(..)) || "
          + "execution(public * com.pqc.core.service.ServiceDiagnosisService.update(..)) || "
          + "execution(public * com.pqc.core.service.ServiceDiagnosisService.linkEvidence(..)) || "
          + "execution(public * com.pqc.core.service.ServiceDiagnosisService.submit(..)) || "
          + "execution(public * com.pqc.core.service.ServiceDiagnosisService.createRevision(..)) || "
           + "execution(public * com.pqc.core.service.ServiceDiagnosisService.cancel(..)) || "
           + "execution(public * com.pqc.core.service.Phase2QuoteService.publish(..)) || "
           + "execution(public * com.pqc.core.service.Phase2QuoteService.updateDraft(..)) || "
           + "execution(public * com.pqc.core.service.Phase2QuoteService.revise(..)) || "
           + "execution(public * com.pqc.core.service.Phase2QuoteService.approve(..)) || "
          + "execution(public * com.pqc.core.service.Phase2QuoteService.reject(..)) || "
          + "execution(public * com.pqc.core.service.Phase2QuoteService.createAddendum(..)) || "
          + "execution(public * com.pqc.core.service.Phase2QuoteService.updateAddendum(..)) || "
          + "execution(public * com.pqc.core.service.Phase2QuoteService.publishAddendum(..)) || "
          + "execution(public * com.pqc.core.service.Phase2QuoteService.approveAddendum(..)) || "
          + "execution(public * com.pqc.core.service.Phase2QuoteService.rejectAddendum(..))")
    public Object terminalizeFailure(ProceedingJoinPoint point) throws Throwable {
        try {
            return point.proceed();
        } catch (Throwable failure) {
            idempotency.failCurrent(failure);
            throw failure;
        }
    }
}
