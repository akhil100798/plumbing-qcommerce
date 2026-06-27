package com.pqc.core.service;

import com.pqc.core.dto.AdminUserDetailResponse;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SuperAdminServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final StoreRepository storeRepository = mock(StoreRepository.class);
    private final ProductOrderRepository productOrderRepository = mock(ProductOrderRepository.class);
    private final ServiceOrderRepository serviceOrderRepository = mock(ServiceOrderRepository.class);

    @SuppressWarnings("unchecked")
    private final ObjectProvider<StringRedisTemplate> redisProvider = mock(ObjectProvider.class);

    @SuppressWarnings("unchecked")
    private final ObjectProvider<KafkaAdmin> kafkaProvider = mock(ObjectProvider.class);

    private final SuperAdminService service = new SuperAdminService(
            userRepository,
            storeRepository,
            productOrderRepository,
            serviceOrderRepository,
            mock(DataSource.class),
            redisProvider,
            kafkaProvider,
            mock(Environment.class)
    );

    @Test
    void superAdminCanSuspendNormalUser() {
        User actor = user(1L, Role.SUPER_ADMIN);
        User target = user(2L, Role.CUSTOMER);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(target)).thenReturn(target);

        AdminUserDetailResponse response = service.updateStatus(2L, UserStatus.SUSPENDED, actor);

        assertThat(response.status()).isEqualTo(UserStatus.SUSPENDED);
    }

    @Test
    void adminCannotSuspendSuperAdmin() {
        User actor = user(1L, Role.ADMIN);
        User target = user(2L, Role.SUPER_ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> service.updateStatus(2L, UserStatus.SUSPENDED, actor))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void userCannotSuspendSelf() {
        User actor = user(1L, Role.SUPER_ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));

        assertThatThrownBy(() -> service.updateStatus(1L, UserStatus.SUSPENDED, actor))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    private User user(Long id, Role role) {
        return User.builder()
                .id(id)
                .email("user" + id + "@example.com")
                .password("password")
                .fullName("User " + id)
                .phone("900000000" + id)
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
    }
}
