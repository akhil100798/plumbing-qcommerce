package com.pqc.core.integration;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.service.ServiceOrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class ServiceOrderLifecycleIntegrationTest {

    @Autowired ServiceOrderRepository serviceOrderRepository;
    @Autowired ProductOrderRepository productOrderRepository;
    @Autowired OutboxEventRepository outboxEventRepository;
    @Autowired UserRepository userRepository;
    @Autowired ServiceOrderService serviceOrderService;

    private User customer;
    private User plumber;
    private User otherPlumber;
    private ServiceOrder acceptedOrder;

    @BeforeEach
    void setUp() {
        outboxEventRepository.deleteAll();
        productOrderRepository.deleteAll();
        serviceOrderRepository.deleteAll();
        userRepository.deleteAll();

        customer = userRepository.save(User.builder()
                .fullName("Lifecycle Customer")
                .email("lifecycle.customer@pqc.com")
                .password("hashed")
                .phone("9999999901")
                .role(Role.CUSTOMER)
                .build());

        plumber = userRepository.save(User.builder()
                .fullName("Lifecycle Plumber")
                .email("lifecycle.plumber@pqc.com")
                .password("hashed")
                .phone("9999999902")
                .role(Role.PLUMBER)
                .build());

        otherPlumber = userRepository.save(User.builder()
                .fullName("Other Plumber")
                .email("other.lifecycle.plumber@pqc.com")
                .password("hashed")
                .phone("9999999903")
                .role(Role.PLUMBER)
                .build());

        acceptedOrder = serviceOrderRepository.save(ServiceOrder.builder()
                .customer(customer)
                .plumber(plumber)
                .description("Kitchen sink repair")
                .customerLatitude(17.4485)
                .customerLongitude(78.3741)
                .requestType(RequestType.NEARBY_AUTO)
                .build());
        acceptedOrder.setStatus(OrderStatus.ACCEPTED);
        acceptedOrder.setAcceptedAt(LocalDateTime.now().minusMinutes(5));
        acceptedOrder = serviceOrderRepository.saveAndFlush(acceptedOrder);

        authenticate(plumber);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignedPlumberCanArriveAcceptedOrder() {
        ServiceOrder updated = serviceOrderService.arriveOrder(acceptedOrder.getId());
        assertThat(updated.getId()).isEqualTo(acceptedOrder.getId());
        assertThat(updated.getArrivedAt()).isNotNull();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
    }

    @Test
    void arriveIsIdempotentWhenAlreadyArrived() {
        LocalDateTime existingArrival = LocalDateTime.now().minusMinutes(1);
        acceptedOrder.setArrivedAt(existingArrival);
        acceptedOrder.setStatus(OrderStatus.ACCEPTED);
        acceptedOrder = serviceOrderRepository.saveAndFlush(acceptedOrder);

        ServiceOrder updated = serviceOrderService.arriveOrder(acceptedOrder.getId());
        assertThat(updated.getArrivedAt().truncatedTo(ChronoUnit.MILLIS))
                .isEqualTo(existingArrival.truncatedTo(ChronoUnit.MILLIS));
    }

    @Test
    void missingOrderReturnsNotFound() {
        assertThatThrownBy(() -> serviceOrderService.arriveOrder(999999L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void invalidStatusTransitionReturnsConflict() {
        acceptedOrder.setStatus(OrderStatus.PENDING);
        acceptedOrder = serviceOrderRepository.saveAndFlush(acceptedOrder);

        assertThatThrownBy(() -> serviceOrderService.arriveOrder(acceptedOrder.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void unassignedPlumberCannotArriveAnotherPlumbersOrder() {
        authenticate(otherPlumber);

        assertThatThrownBy(() -> serviceOrderService.arriveOrder(acceptedOrder.getId()))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }
}
