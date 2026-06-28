package com.pqc.core.service;

import com.pqc.core.document.ServiceLog;
import com.pqc.core.document.ServiceLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceLogService {

    private final ObjectProvider<ServiceLogRepository> serviceLogRepositoryProvider;
    private final com.pqc.core.repository.OutboxEventRepository outboxRepository;

    @Transactional
    public ServiceLog createLog(Long orderId, Long plumberId, String diagnosis,
                                String workDone, List<ServiceLog.PartUsed> partsUsed,
                                String notes, String photoUrl) {

        // Calculate total parts value for inventory reconciliation
        BigDecimal totalPartsValue = partsUsed != null ? partsUsed.stream()
                .map(p -> p.getUnitPrice().multiply(BigDecimal.valueOf(p.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

        ServiceLog serviceLog = ServiceLog.builder()
                .orderId(orderId)
                .plumberId(plumberId)
                .diagnosis(diagnosis)
                .workDone(workDone)
                .partsUsed(partsUsed)
                .plumberNotes(notes)
                .photoUrl(photoUrl)
                .loggedAt(LocalDateTime.now())
                .build();

        ServiceLog saved = null;
        ServiceLogRepository serviceLogRepository = serviceLogRepositoryProvider.getIfAvailable();
        if (serviceLogRepository != null) {
            saved = serviceLogRepository.save(serviceLog);
        } else {
            log.warn("MongoDB is disabled; skipping ServiceLog persistence.");
            saved = serviceLog;
        }

        // Save to PostgreSQL Outbox for transactional safety
        outboxRepository.save(com.pqc.core.entity.OutboxEvent.builder()
                .aggregateId(String.valueOf(orderId))
                .aggregateType("SERVICE_LOG")
                .eventType("INVENTORY_DEDUCTED")
                .topic("inventory-deducted")
                .payload("INVENTORY_DEDUCTED:ORDER:" + orderId + ":VALUE:" + totalPartsValue)
                .processed(false)
                .build());

        log.info("Service log for order #{} saved. Event persisted in Outbox for inventory reconciliation.", orderId);

        return saved;
    }

    public List<ServiceLog> getLogsByOrder(Long orderId) {
        ServiceLogRepository serviceLogRepository = serviceLogRepositoryProvider.getIfAvailable();
        if (serviceLogRepository != null) {
            return serviceLogRepository.findByOrderId(orderId);
        }
        log.warn("MongoDB is disabled; returning empty ServiceLog list.");
        return new ArrayList<>();
    }

    public List<ServiceLog> getLogsByPlumber(Long plumberId) {
        ServiceLogRepository serviceLogRepository = serviceLogRepositoryProvider.getIfAvailable();
        if (serviceLogRepository != null) {
            return serviceLogRepository.findByPlumberId(plumberId);
        }
        log.warn("MongoDB is disabled; returning empty ServiceLog list.");
        return new ArrayList<>();
    }
}

