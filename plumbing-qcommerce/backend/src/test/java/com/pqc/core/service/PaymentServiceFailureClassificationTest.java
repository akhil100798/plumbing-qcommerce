package com.pqc.core.service;

import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PaymentServiceFailureClassificationTest {
    @Test
    void gatewaySuccessWithLocalFinalizationFailureRequiresReconciliation() {
        ServiceOrderRepository orders = mock(ServiceOrderRepository.class);
        PaymentGatewayAdapter gateway = mock(PaymentGatewayAdapter.class);
        CurrentUser currentUser = mock(CurrentUser.class);
        LaunchPolicyService policy = mock(LaunchPolicyService.class);
        PaymentOperationService operations = mock(PaymentOperationService.class);
        PaymentFinalizationService finalization = mock(PaymentFinalizationService.class);

        User customer = User.builder().id(10L).role(Role.CUSTOMER).build();
        ServiceOrder order = ServiceOrder.builder().id(20L).customer(customer)
                .description("payment").requestType(RequestType.NEARBY_AUTO)
                .status(OrderStatus.COMPLETED).totalAmount(new BigDecimal("250.00")).build();
        PaymentOperation operation = PaymentOperation.builder().id(30L).serviceOrderId(20L)
                .purpose(PaymentOperationService.PURPOSE).idempotencyKey("service-order:20:capture:v1")
                .status(PaymentOperationStatus.INITIATED).amount(order.getTotalAmount()).currency("INR").build();

        when(orders.findById(20L)).thenReturn(Optional.of(order));
        when(currentUser.require()).thenReturn(customer);
        when(policy.authoritativeCurrency()).thenReturn("INR");
        when(operations.getOrCreate(20L, order.getTotalAmount(), "INR")).thenReturn(operation);
        operation.setStatus(PaymentOperationStatus.CAPTURE_IN_PROGRESS);
        when(operations.claimCapture(operation)).thenReturn(new PaymentOperationService.CaptureClaim(operation, true));
        when(gateway.capturePayment(20L, order.getTotalAmount(), "pm_card", "INR",
                operation.getIdempotencyKey())).thenReturn("tx-30");
        doThrow(new IllegalStateException("outbox unavailable"))
                .when(finalization).finalizeCapture(30L, "tx-30");

        PaymentService service = new PaymentService(orders, gateway, currentUser, policy, operations, finalization);
        var response = service.processPayment(new PaymentRequest(20L, "pm_card", order.getTotalAmount(), "INR"));

        assertThat(response.getStatus()).isEqualTo("FAILED");
        assertThat(response.getMessage()).contains("requires reconciliation");
        verify(operations).markReconciliationRequired(30L, "outbox unavailable");
        verify(gateway, times(1)).capturePayment(20L, order.getTotalAmount(), "pm_card", "INR",
                operation.getIdempotencyKey());
    }
}
