package com.pqc.core.service;

import com.pqc.core.dto.OperationsCancelOrderRequest;
import com.pqc.core.dto.ReassignDeliveryRequest;
import com.pqc.core.dto.ReassignPlumberRequest;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OperationsAdminServiceTest {

    private final ProductOrderRepository productOrderRepository = mock(ProductOrderRepository.class);
    private final ServiceOrderRepository serviceOrderRepository = mock(ServiceOrderRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final OperationsAdminService service = new OperationsAdminService(productOrderRepository, serviceOrderRepository, userRepository);

    @Test
    void operationsAdminCanReassignPlumber() {
        ServiceOrder job = serviceJob(OrderStatus.ACCEPTED);
        User newPlumber = user(5L, Role.PLUMBER);
        when(serviceOrderRepository.findById(1L)).thenReturn(Optional.of(job));
        when(userRepository.findById(5L)).thenReturn(Optional.of(newPlumber));
        when(serviceOrderRepository.save(job)).thenReturn(job);

        var response = service.reassignPlumber(1L, new ReassignPlumberRequest(5L, "Current plumber unavailable"));

        assertThat(response.plumberName()).isEqualTo("PLUMBER User");
    }

    @Test
    void cannotReassignCompletedOrCancelledJob() {
        when(serviceOrderRepository.findById(1L)).thenReturn(Optional.of(serviceJob(OrderStatus.COMPLETED)));

        assertThatThrownBy(() -> service.reassignPlumber(1L, new ReassignPlumberRequest(5L, "Done job")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void operationsAdminCanReassignDeliveryPartner() {
        ProductOrder order = productOrder(ProductOrderStatus.CONFIRMED);
        User partner = user(6L, Role.DELIVERY_PARTNER);
        when(productOrderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(userRepository.findById(6L)).thenReturn(Optional.of(partner));
        when(productOrderRepository.save(order)).thenReturn(order);

        var response = service.reassignDelivery(1L, new ReassignDeliveryRequest(6L, "Delayed partner"));

        assertThat(response.deliveryPartnerName()).isEqualTo("DELIVERY_PARTNER User");
        assertThat(response.status()).isEqualTo(ProductOrderStatus.OUT_FOR_DELIVERY);
    }

    @Test
    void cannotCancelDeliveredOrder() {
        when(productOrderRepository.findById(1L)).thenReturn(Optional.of(productOrder(ProductOrderStatus.DELIVERED)));

        assertThatThrownBy(() -> service.cancelProductOrder(1L, new OperationsCancelOrderRequest("Too late")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    private ServiceOrder serviceJob(OrderStatus status) {
        return ServiceOrder.builder()
                .id(1L)
                .customer(user(2L, Role.CUSTOMER))
                .plumber(user(3L, Role.PLUMBER))
                .requestType(RequestType.NEARBY_AUTO)
                .description("Leak")
                .status(status)
                .build();
    }

    private ProductOrder productOrder(ProductOrderStatus status) {
        return ProductOrder.builder()
                .id(1L)
                .customer(user(2L, Role.CUSTOMER))
                .totalAmount(new BigDecimal("500.00"))
                .status(status)
                .build();
    }

    private User user(Long id, Role role) {
        return User.builder()
                .id(id)
                .email("user" + id + "@example.com")
                .password("password")
                .fullName(role.name() + " User")
                .phone("900000000" + id)
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
    }
}
