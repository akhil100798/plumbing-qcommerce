package com.pqc.core.order;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.service.ServiceOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ConcurrentOrderAcceptanceIT {

    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired StoreRepository stores;
    @Autowired OutboxEventRepository outbox;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired ServiceOrderService orderService;

    private User customer;
    private User plumberOne;
    private User plumberTwo;
    private ServiceOrder order;

    @BeforeEach
    void setUp() {
        outbox.deleteAll();
        orders.deleteAll();
        stores.deleteAll();
        users.deleteAll();

        customer = saveUser("customer-race@example.com", Role.CUSTOMER);
        plumberOne = saveUser("plumber-one-race@example.com", Role.PLUMBER);
        plumberTwo = saveUser("plumber-two-race@example.com", Role.PLUMBER);
        order = orders.save(ServiceOrder.builder()
                .customer(customer)
                .description("Race order")
                .customerLatitude(19.07)
                .customerLongitude(72.87)
                .requestType(RequestType.NEARBY_AUTO)
                .status(OrderStatus.PENDING)
                .build());
    }

    @RepeatedTest(20)
    void twoPlumbersAcceptingConcurrentlyHasExactlyOneWinner() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Result> first = executor.submit(acceptAs(plumberOne, start));
            Future<Result> second = executor.submit(acceptAs(plumberTwo, start));
            start.countDown();

            List<Result> results = List.of(first.get(), second.get());

            assertThat(results.stream().filter(Result::accepted).count()).isEqualTo(1);
            assertThat(results.stream().filter(Result::conflict).count()).isEqualTo(1);
            ServiceOrder saved = orders.findById(order.getId()).orElseThrow();
            assertThat(saved.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
            assertThat(saved.getPlumber().getId())
                    .isIn(plumberOne.getId(), plumberTwo.getId());
        } finally {
            executor.shutdownNow();
            SecurityContextHolder.clearContext();
        }
    }

    private Callable<Result> acceptAs(User plumber, CountDownLatch start) {
        return () -> {
            authenticate(plumber);
            start.await();
            try {
                orderService.acceptOrder(order.getId(), plumber.getId());
                return Result.ACCEPTED;
            } catch (RuntimeException ex) {
                if ("OrderConflictException".equals(ex.getClass().getSimpleName())) {
                    return Result.CONFLICT;
                }
                throw ex;
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
    }

    private User saveUser(String email, Role role) {
        return users.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123!"))
                .fullName(role.name())
                .phone("9999999999")
                .role(role)
                .build());
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }

    private enum Result {
        ACCEPTED,
        CONFLICT;

        boolean accepted() {
            return this == ACCEPTED;
        }

        boolean conflict() {
            return this == CONFLICT;
        }
    }
}
