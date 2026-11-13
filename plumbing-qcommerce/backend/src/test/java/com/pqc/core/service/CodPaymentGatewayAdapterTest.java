package com.pqc.core.service;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.ServiceOrderStatusHistory;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.ServiceOrderStatusHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodPaymentGatewayAdapterTest {

    @Mock
    private ServiceOrderRepository orderRepository;

    @Mock
    private ServiceOrderStatusHistoryRepository historyRepository;

    private CodPaymentGatewayAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new CodPaymentGatewayAdapter(orderRepository, historyRepository);
    }

    @Test
    void capturePayment_withValidCompletedOrder_returnsCodTransactionIdAndAppendsHistory() {
        User customer = User.builder().id(42L).role(Role.CUSTOMER).build();
        ServiceOrder order = ServiceOrder.builder()
                .id(101L)
                .status(OrderStatus.CUSTOMER_CONFIRMED)
                .customer(customer)
                .totalAmount(new BigDecimal("750.00"))
                .build();

        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));

        String txId = adapter.capturePayment(101L, new BigDecimal("750.00"), "COD", "INR", "idem-101");

        assertThat(txId).isNotNull().startsWith("cod_tx_101_");

        ArgumentCaptor<ServiceOrderStatusHistory> captor = ArgumentCaptor.forClass(ServiceOrderStatusHistory.class);
        verify(historyRepository).save(captor.capture());

        ServiceOrderStatusHistory history = captor.getValue();
        assertThat(history.getServiceOrderId()).isEqualTo(101L);
        assertThat(history.getNewStatus()).isEqualTo(CodPaymentGatewayAdapter.STATUS_PENDING_COLLECTION);
        assertThat(history.getActorId()).isEqualTo(42L);
        assertThat(history.getReason()).contains(CodPaymentGatewayAdapter.STATUS_COD_PENDING);
    }

    @Test
    void capturePayment_withNullOrderId_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.capturePayment(null, new BigDecimal("100.00"), "COD", "INR", "idem-key"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Order ID cannot be null");
    }

    @Test
    void capturePayment_withZeroOrNegativeAmount_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.capturePayment(1L, BigDecimal.ZERO, "COD", "INR", "idem-key"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid COD amount");

        assertThatThrownBy(() -> adapter.capturePayment(1L, new BigDecimal("-50.00"), "COD", "INR", "idem-key"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid COD amount");
    }

    @Test
    void capturePayment_withNonExistentOrder_throwsIllegalArgumentException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adapter.capturePayment(999L, new BigDecimal("100.00"), "COD", "INR", "idem-key"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Service order #999 not found");
    }

    @Test
    void capturePayment_withAlreadyPaidOrder_throwsIllegalStateException() {
        ServiceOrder paidOrder = ServiceOrder.builder()
                .id(202L)
                .status(OrderStatus.PAID)
                .build();
        when(orderRepository.findById(202L)).thenReturn(Optional.of(paidOrder));

        assertThatThrownBy(() -> adapter.capturePayment(202L, new BigDecimal("250.00"), "COD", "INR", "idem-key"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already marked as PAID");
    }

    @Test
    void capturePayment_withCancelledOrder_throwsIllegalStateException() {
        ServiceOrder cancelledOrder = ServiceOrder.builder()
                .id(303L)
                .status(OrderStatus.CANCELLED)
                .build();
        when(orderRepository.findById(303L)).thenReturn(Optional.of(cancelledOrder));

        assertThatThrownBy(() -> adapter.capturePayment(303L, new BigDecimal("250.00"), "COD", "INR", "idem-key"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("is cancelled; cannot capture COD payment");
    }

    @Test
    void processPayout_withValidUser_returnsCodPayoutReference() {
        String payoutRef = adapter.processPayout(55L, "PLUMBER", new BigDecimal("500.00"));

        assertThat(payoutRef).isNotNull().startsWith("cod_payout_55_");
    }

    @Test
    void processPayout_withInvalidInputs_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.processPayout(null, "PLUMBER", new BigDecimal("500.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User ID cannot be null");

        assertThatThrownBy(() -> adapter.processPayout(55L, "PLUMBER", BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payout amount must be positive");
    }
}
