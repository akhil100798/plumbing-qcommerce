package com.pqc.core.service;

import com.pqc.core.dto.AdminUserDetailResponse;
import com.pqc.core.dto.AdminUserListResponse;
import com.pqc.core.dto.SuperAdminDashboardResponse;
import com.pqc.core.dto.SystemHealthResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.admin.AdminClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private static final Set<Role> ADMIN_ROLES = EnumSet.of(
            Role.SUPER_ADMIN,
            Role.ADMIN,
            Role.OPERATIONS_ADMIN,
            Role.PLUMBER_MANAGER,
            Role.FINANCE_ADMIN,
            Role.SUPPORT_ADMIN,
            Role.MARKETING_ADMIN
    );

    private static final Set<Role> NORMAL_ROLES = EnumSet.of(
            Role.CUSTOMER,
            Role.PLUMBER,
            Role.STORE_MANAGER,
            Role.DELIVERY_PARTNER
    );

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductOrderRepository productOrderRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final DataSource dataSource;
    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final ObjectProvider<KafkaAdmin> kafkaAdminProvider;
    private final Environment environment;

    public SuperAdminDashboardResponse getDashboard() {
        BigDecimal serviceRevenue = serviceOrderRepository.sumCompletedOrdersRevenue();
        BigDecimal productRevenue = productOrderRepository.sumTotalAmountByStatus(ProductOrderStatus.DELIVERED);
        BigDecimal totalRevenue = safe(serviceRevenue).add(safe(productRevenue));

        long pendingProductOrders = productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.PENDING));
        long pendingServiceOrders = serviceOrderRepository.countByStatus(OrderStatus.PENDING);

        return new SuperAdminDashboardResponse(
                userRepository.countByRole(Role.CUSTOMER),
                userRepository.countByRole(Role.PLUMBER),
                userRepository.countByRole(Role.STORE_MANAGER),
                userRepository.countByRole(Role.DELIVERY_PARTNER),
                userRepository.countByRoleIn(ADMIN_ROLES),
                storeRepository.count(),
                productOrderRepository.count(),
                serviceOrderRepository.count(),
                totalRevenue,
                pendingProductOrders + pendingServiceOrders,
                activeServiceJobs(),
                productOrderRepository.countByServiceOrderIsNotNullAndStatusIn(List.of(
                        ProductOrderStatus.PENDING,
                        ProductOrderStatus.CONFIRMED,
                        ProductOrderStatus.PACKING,
                        ProductOrderStatus.READY_FOR_PICKUP,
                        ProductOrderStatus.OUT_FOR_DELIVERY
                ))
        );
    }

    public AdminUserListResponse listUsers(Role role, UserStatus status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id"));
        Page<User> users = userRepository.findAll(userSpecification(role, status, search), pageable);
        return toListResponse(users);
    }

    public AdminUserDetailResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toDetailResponse(user);
    }

    public AdminUserDetailResponse updateStatus(Long id, UserStatus status, User actor) {
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!canUpdateStatus(actor, target)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to update this user status");
        }
        target.setStatus(status);
        return toDetailResponse(userRepository.save(target));
    }

    public AdminUserListResponse listAdminUsers() {
        Page<User> users = userRepository.findByRoleIn(ADMIN_ROLES, PageRequest.of(0, 500, Sort.by("role", "email")));
        return toListResponse(users);
    }

    public SystemHealthResponse getSystemHealth() {
        return new SystemHealthResponse(
                "UP",
                databaseStatus(),
                redisStatus(),
                kafkaStatus(),
                edgeServiceStatus(),
                LocalDateTime.now()
        );
    }

    private Specification<User> userSpecification(Role role, UserStatus status, String search) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (role != null) {
                predicate = cb.and(predicate, cb.equal(root.get("role"), role));
            }
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }
            return predicate;
        };
    }

    private AdminUserListResponse toListResponse(Page<User> users) {
        List<AdminUserListResponse.UserSummary> summaries = users.stream()
                .map(this::toSummary)
                .toList();
        return new AdminUserListResponse(
                summaries,
                users.getNumber(),
                users.getSize(),
                users.getTotalElements(),
                users.getTotalPages()
        );
    }

    private AdminUserListResponse.UserSummary toSummary(User user) {
        return new AdminUserListResponse.UserSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                null
        );
    }

    private AdminUserDetailResponse toDetailResponse(User user) {
        Store linkedStore = user.getRole() == Role.STORE_MANAGER
                ? storeRepository.findFirstByManager_Id(user.getId()).orElse(null)
                : null;

        return new AdminUserDetailResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                null,
                linkedStore == null ? null : new AdminUserDetailResponse.LinkedStoreSummary(
                        linkedStore.getId(),
                        linkedStore.getName(),
                        linkedStore.getAddress()
                ),
                new AdminUserDetailResponse.ActivitySummary(
                        user.getRole() == Role.CUSTOMER ? productOrderRepository.countByCustomerId(user.getId()) : 0,
                        user.getRole() == Role.PLUMBER ? serviceOrderRepository.countByPlumber_Id(user.getId())
                                : user.getRole() == Role.CUSTOMER ? serviceOrderRepository.countByCustomer_Id(user.getId()) : 0,
                        user.getRole() == Role.DELIVERY_PARTNER ? productOrderRepository.countByDeliveryPartnerId(user.getId()) : 0,
                        linkedStore == null ? 0 : 1
                )
        );
    }

    private boolean canUpdateStatus(User actor, User target) {
        if (actor == null || actor.getId() == null || target == null || target.getId() == null) {
            return false;
        }
        if (actor.getId().equals(target.getId())) {
            return false;
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        return actor.getRole() == Role.ADMIN && NORMAL_ROLES.contains(target.getRole());
    }

    private long activeServiceJobs() {
        return serviceOrderRepository.countByStatus(OrderStatus.ACCEPTED)
                + serviceOrderRepository.countByStatus(OrderStatus.IN_PROGRESS)
                + serviceOrderRepository.countByStatus(OrderStatus.COMBINED_ORDER);
    }

    private BigDecimal safe(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private String databaseStatus() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(1) ? "UP" : "UNKNOWN";
        } catch (Exception ignored) {
            return "UNKNOWN";
        }
    }

    private String redisStatus() {
        try {
            StringRedisTemplate redisTemplate = redisTemplateProvider.getIfAvailable();
            if (redisTemplate == null || redisTemplate.getConnectionFactory() == null) {
                return "UNKNOWN";
            }
            String ping = redisTemplate.getConnectionFactory().getConnection().ping();
            return "PONG".equalsIgnoreCase(ping) ? "UP" : "UNKNOWN";
        } catch (Exception ignored) {
            return "UNKNOWN";
        }
    }

    private String kafkaStatus() {
        try {
            KafkaAdmin kafkaAdmin = kafkaAdminProvider.getIfAvailable();
            if (kafkaAdmin == null) {
                return "UNKNOWN";
            }
            Map<String, Object> config = new HashMap<>(kafkaAdmin.getConfigurationProperties());
            config.put("request.timeout.ms", 500);
            config.put("default.api.timeout.ms", 500);
            try (AdminClient adminClient = AdminClient.create(config)) {
                adminClient.describeCluster().nodes().get(750, TimeUnit.MILLISECONDS);
                return "UP";
            }
        } catch (Exception ignored) {
            return "UNKNOWN";
        }
    }

    private String edgeServiceStatus() {
        return environment.containsProperty("edge.service.url") ? "UNKNOWN" : "UNKNOWN";
    }
}
