package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.ServiceOrderAssignmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@SpringBootTest
@ActiveProfiles("test")
class PhaseOneAssignmentRollbackIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired PlumberKycRepository kyc;
    @Autowired ServiceOrderAssignmentRepository assignments;
    @Autowired ServiceOrderStatusHistoryRepository histories;
    @Autowired OutboxEventRepository outbox;
    @Autowired ServiceOrderAssignmentService assignmentService;
    @MockitoSpyBean OutboxEventRepository outboxFailure;
    @MockitoSpyBean ServiceOrderStatusHistoryRepository historyFailure;

    private User customer;
    private User plumber;

    @BeforeEach
    void reset() {
        jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String table : List.of("service_order_assignments", "service_order_plumber_dispositions", "service_order_status_history", "outbox_events", "service_orders", "plumber_kyc", "users")) jdbc.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY");
        jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
        customer = save("rollback-customer@phase1.test", "Customer", Role.CUSTOMER);
        plumber = save("rollback-plumber@phase1.test", "Plumber", Role.PLUMBER);
        kyc.save(PlumberKyc.builder().plumberId(plumber.getId()).status(PlumberKycStatus.APPROVED).availabilityStatus(PlumberAvailabilityStatus.ONLINE).build());
    }

    @Test
    void outboxFailureRollsBackAssignmentMutationAndAllAuditRows() {
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).description("Leak").issueCategory("pipe").requestType(RequestType.NEARBY_AUTO).status(OrderStatus.PENDING).build());
        authenticate(plumber);
        doThrow(new IllegalStateException("outbox unavailable")).when(outboxFailure).save(any(OutboxEvent.class));

        assertThatThrownBy(() -> assignmentService.accept(order.getId(), plumber.getId()))
                .hasMessageContaining("outbox unavailable");

        ServiceOrder persisted = orders.findById(order.getId()).orElseThrow();
        assertThat(persisted.getPlumber()).isNull();
        assertThat(persisted.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(assignments.findByServiceOrderIdOrderByCreatedAtAsc(order.getId())).isEmpty();
        assertThat(histories.findByServiceOrderIdOrderByCreatedAtAsc(order.getId())).isEmpty();
        assertThat(outbox.findAll()).isEmpty();
    }

    @Test
    void historyFailureRollsBackAssignmentMutationAndAllAuditRows() {
        ServiceOrder order = orders.saveAndFlush(ServiceOrder.builder().customer(customer).description("Leak").issueCategory("pipe").requestType(RequestType.NEARBY_AUTO).status(OrderStatus.PENDING).build());
        authenticate(plumber);
        doThrow(new IllegalStateException("history unavailable")).when(historyFailure).save(any(ServiceOrderStatusHistory.class));

        assertThatThrownBy(() -> assignmentService.accept(order.getId(), plumber.getId()))
                .hasMessageContaining("history unavailable");

        ServiceOrder persisted = orders.findById(order.getId()).orElseThrow();
        assertThat(persisted.getPlumber()).isNull();
        assertThat(persisted.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(assignments.findByServiceOrderIdOrderByCreatedAtAsc(order.getId())).isEmpty();
        assertThat(histories.findByServiceOrderIdOrderByCreatedAtAsc(order.getId())).isEmpty();
        assertThat(outbox.findAll()).isEmpty();
    }

    private User save(String email, String name, Role role) { return users.save(User.builder().email(email).fullName(name).phone("9999999999").password("Password123!").role(role).status(UserStatus.ACTIVE).build()); }
    private void authenticate(User user) { SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))); }
}
