package com.pqc.core.service;

import com.pqc.core.document.ServiceLog;
import com.pqc.core.document.ServiceLogRepository;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceLogService {

    private final ServiceLogRepository serviceLogRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ServiceOrderRepository orderRepository;
    private final CurrentUser currentUser;

    public ServiceLog createLog(Long orderId, Long plumberId, String diagnosis,
                                String workDone, List<ServiceLog.PartUsed> partsUsed,
                                String notes, String photoUrl) {
        User actor = currentUser.require();
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        boolean assignedPlumber = actor.getRole() == Role.PLUMBER
                && actor.getId().equals(plumberId)
                && order.getPlumber() != null
                && order.getPlumber().getId().equals(actor.getId());
        if (!assignedPlumber) {
            throw new AccessDeniedException("Only the assigned plumber may create a service log");
        }

        // Calculate total parts value for inventory reconciliation
        BigDecimal totalPartsValue = partsUsed != null ? partsUsed.stream()
                .map(p -> p.getUnitPrice().multiply(BigDecimal.valueOf(p.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

        ServiceLog log = ServiceLog.builder()
                .orderId(orderId)
                .plumberId(plumberId)
                .diagnosis(diagnosis)
                .workDone(workDone)
                .partsUsed(partsUsed)
                .plumberNotes(notes)
                .photoUrl(photoUrl)
                .loggedAt(LocalDateTime.now())
                .build();

        ServiceLog saved = serviceLogRepository.save(log);

        // Publish Kafka event for inventory deduction
        kafkaTemplate.send("inventory-deducted", String.valueOf(orderId),
                "INVENTORY_DEDUCTED:ORDER:" + orderId + ":VALUE:" + totalPartsValue);

        return saved;
    }

    public List<ServiceLog> getLogsByOrder(Long orderId) {
        return serviceLogRepository.findByOrderId(orderId);
    }

    public List<ServiceLog> getLogsByPlumber(Long plumberId) {
        return serviceLogRepository.findByPlumberId(plumberId);
    }
}
