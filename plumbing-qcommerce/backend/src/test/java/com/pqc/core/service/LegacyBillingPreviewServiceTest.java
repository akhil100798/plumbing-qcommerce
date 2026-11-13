package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LegacyBillingPreviewServiceTest {
    @Mock ServiceOrderRepository orders;
    @Mock ProductOrderRepository productOrders;

    @Test
    void visitFeeIsExcludedButApprovedRepairExtraIsIncludedInRepairAmount() {
        LocalDateTime started = LocalDateTime.of(2026, 1, 1, 10, 0);
        ServiceOrder order = ServiceOrder.builder().id(1L).startedAt(started).visitFee(new BigDecimal("99.00")).build();
        when(orders.findById(1L)).thenReturn(Optional.of(order));
        ProductOrder delivered = ProductOrder.builder().totalAmount(new BigDecimal("100.00")).status(ProductOrderStatus.DELIVERED).build();
        when(productOrders.findByServiceOrderIdAndStatus(1L, ProductOrderStatus.DELIVERED)).thenReturn(List.of(delivered));
        LegacyBillingPreviewService.Preview preview = new LegacyBillingPreviewService(orders, productOrders)
                .preview(1L, new BigDecimal("25.00"), started.plusHours(1));
        assertThat(preview.visitFee()).isEqualByComparingTo("99.00");
        assertThat(preview.legacyRepairAmount()).isEqualByComparingTo("425.00");
        assertThat(preview.finalLegacyAmount()).isEqualByComparingTo("475.00");
        assertThat(preview.components().platformFee()).isEqualByComparingTo("50.00");
        assertThat(preview.components().referralCommission()).isEqualByComparingTo("10.00");
    }
}
