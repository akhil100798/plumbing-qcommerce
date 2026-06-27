package com.pqc.core.service;

import com.pqc.core.dto.RefundActionRequest;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class FinanceAdminServiceTest {
    private final ProductOrderRepository productOrderRepository = mock(ProductOrderRepository.class);
    private final ServiceOrderRepository serviceOrderRepository = mock(ServiceOrderRepository.class);
    private final SettlementRepository settlementRepository = mock(SettlementRepository.class);
    private final RefundRequestRepository refundRequestRepository = mock(RefundRequestRepository.class);
    private final WalletRepository walletRepository = mock(WalletRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final StoreRepository storeRepository = mock(StoreRepository.class);
    private final FinanceAdminService service = new FinanceAdminService(productOrderRepository, serviceOrderRepository, settlementRepository, refundRequestRepository, walletRepository, userRepository, storeRepository);

    @Test
    void approvePendingRefund() {
        RefundRequest refund = refund(RefundStatus.PENDING);
        when(refundRequestRepository.findById(1L)).thenReturn(Optional.of(refund));
        when(refundRequestRepository.save(refund)).thenReturn(refund);
        var response = service.approveRefund(1L, new RefundActionRequest("Approved"));
        assertThat(response.status()).isEqualTo(RefundStatus.APPROVED);
    }

    @Test
    void rejectPendingRefund() {
        RefundRequest refund = refund(RefundStatus.PENDING);
        when(refundRequestRepository.findById(1L)).thenReturn(Optional.of(refund));
        when(refundRequestRepository.save(refund)).thenReturn(refund);
        var response = service.rejectRefund(1L, new RefundActionRequest("Rejected"));
        assertThat(response.status()).isEqualTo(RefundStatus.REJECTED);
    }

    @Test
    void cannotApproveAlreadyUpdatedRefund() {
        when(refundRequestRepository.findById(1L)).thenReturn(Optional.of(refund(RefundStatus.APPROVED)));
        assertThatThrownBy(() -> service.approveRefund(1L, new RefundActionRequest("Again"))).isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");
    }

    private RefundRequest refund(RefundStatus status) { return RefundRequest.builder().id(1L).orderId(2L).customerId(3L).amount(new BigDecimal("25.00")).reason("Test").status(status).build(); }
}