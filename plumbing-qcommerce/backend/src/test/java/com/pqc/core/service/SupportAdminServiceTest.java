package com.pqc.core.service;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class SupportAdminServiceTest {
    private final SupportTicketRepository supportTicketRepository = mock(SupportTicketRepository.class);
    private final SupportMessageRepository supportMessageRepository = mock(SupportMessageRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ProductOrderRepository productOrderRepository = mock(ProductOrderRepository.class);
    private final ServiceOrderRepository serviceOrderRepository = mock(ServiceOrderRepository.class);
    private final SupportAdminService service = new SupportAdminService(supportTicketRepository, supportMessageRepository, userRepository, productOrderRepository, serviceOrderRepository);

    @Test
    void rejectsInvalidStatusTransition() {
        SupportTicket ticket = ticket(SupportTicketStatus.OPEN);
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        assertThatThrownBy(() -> service.updateStatus(1L, new SupportStatusUpdateRequest(SupportTicketStatus.CLOSED)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");
    }

    @Test
    void rejectsAssigningTicketToCustomer() {
        SupportTicket ticket = ticket(SupportTicketStatus.OPEN);
        User customer = User.builder().id(9L).role(Role.CUSTOMER).fullName("Customer User").email("c@example.com").phone("999").password("x").status(UserStatus.ACTIVE).build();
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(9L)).thenReturn(Optional.of(customer));
        assertThatThrownBy(() -> service.assignTicket(1L, new SupportAssignRequest(9L)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");
    }

    @Test
    void escalatesTicketAndStoresReason() {
        SupportTicket ticket = ticket(SupportTicketStatus.IN_PROGRESS);
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(supportTicketRepository.save(ticket)).thenReturn(ticket);
        SupportTicketSummary summary = service.escalateTicket(1L, new SupportEscalateRequest("Needs finance review"));
        assertThat(summary.status()).isEqualTo(SupportTicketStatus.ESCALATED);
        assertThat(ticket.getEscalationReason()).isEqualTo("Needs finance review");
    }

    private SupportTicket ticket(SupportTicketStatus status) { return SupportTicket.builder().id(1L).ticketNumber("SUP-000001").requesterId(2L).requesterRole(Role.CUSTOMER).category(SupportTicketCategory.DELIVERY).priority(SupportTicketPriority.HIGH).status(status).subject("Delay").description("Delayed").build(); }
}