package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;

@Service @RequiredArgsConstructor
public class LegacyBillingPreviewService {
    private final ServiceOrderRepository orders;
    private final ProductOrderRepository productOrders;
    private final LegacyBillingCalculator calculator = new LegacyBillingCalculator();

    @Transactional(readOnly = true)
    public Preview preview(Long orderId, BigDecimal extraCharge, LocalDateTime at) {
        ServiceOrder order = orders.findById(orderId).orElseThrow();
        LocalDateTime now = at == null ? LocalDateTime.now() : at;
        LocalDateTime started = order.getStartedAt() == null ? now : order.getStartedAt();
        long minutes = Duration.between(started, now).toMinutes();
        BigDecimal delivered = productOrders.findByServiceOrderIdAndStatus(orderId, ProductOrderStatus.DELIVERED).stream()
                .map(p -> p.getTotalAmount() == null ? BigDecimal.ZERO : p.getTotalAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        LegacyBillingResult result = calculator.calculate(minutes, delivered, extraCharge);
        BigDecimal repair = repairAmount(result, BigDecimal.ZERO);
        BigDecimal visitFee = order.getVisitFee() == null ? BigDecimal.ZERO.setScale(2) : order.getVisitFee().setScale(2);
        return new Preview(result, result.totalAmount(), repair, visitFee);
    }

    public BigDecimal repairAmount(LegacyBillingResult result, BigDecimal approvedRepairScopeExtra) {
        return result.laborCharge().add(result.deliveredPartsTotal())
                .add(result.approvedExtraCharge()).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public record Preview(LegacyBillingResult components, BigDecimal finalLegacyAmount,
                          BigDecimal legacyRepairAmount, BigDecimal visitFee) { }
}
