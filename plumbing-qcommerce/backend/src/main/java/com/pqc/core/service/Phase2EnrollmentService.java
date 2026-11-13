package com.pqc.core.service;

import com.pqc.core.config.Phase2Properties;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service @RequiredArgsConstructor
public class Phase2EnrollmentService {
    private final Phase2EnrollmentRepository enrollments;
    private final ServiceOrderRepository orders;
    private final Phase2Properties properties;

    @Transactional
    public Phase2Enrollment enrollIfEnabledAfterArrival(Long serviceOrderId) {
        ServiceOrder order = orders.findByIdForUpdate(serviceOrderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service order not found"));
        if (order.getArrivedAt() == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Enrollment requires arrival");
        return enrollments.findByServiceOrderIdForUpdate(serviceOrderId).orElseGet(() -> {
            if (!properties.isEnabled()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Phase 2 is disabled");
            return enrollments.saveAndFlush(Phase2Enrollment.builder().serviceOrderId(serviceOrderId)
                    .enabledSnapshot(true).policySnapshot("phase2DiagnosisQuotes.enabled=true").build());
        });
    }

    @Transactional(readOnly = true)
    public boolean isEnrolled(Long serviceOrderId) { return enrollments.findByServiceOrderId(serviceOrderId).isPresent(); }
}
