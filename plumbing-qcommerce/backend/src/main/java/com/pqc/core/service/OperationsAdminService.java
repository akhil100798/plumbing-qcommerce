package com.pqc.core.service;

import com.pqc.core.dto.AvailableDeliveryPartnerResponse;
import com.pqc.core.dto.OperationsCancelOrderRequest;
import com.pqc.core.dto.OperationsDashboardResponse;
import com.pqc.core.dto.OperationsMaterialRequestSummary;
import com.pqc.core.dto.OperationsProductOrderDetail;
import com.pqc.core.dto.OperationsProductOrderSummary;
import com.pqc.core.dto.OperationsServiceJobDetail;
import com.pqc.core.dto.OperationsServiceJobSummary;
import com.pqc.core.dto.ReassignDeliveryRequest;
import com.pqc.core.dto.ReassignPlumberRequest;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OperationsAdminService {

    private static final List<ProductOrderStatus> ACTIVE_PRODUCT_STATUSES = List.of(
            ProductOrderStatus.PENDING,
            ProductOrderStatus.CONFIRMED,
            ProductOrderStatus.PACKING,
            ProductOrderStatus.READY_FOR_PICKUP,
            ProductOrderStatus.OUT_FOR_DELIVERY
    );

    private static final List<OrderStatus> ACTIVE_SERVICE_STATUSES = List.of(
            OrderStatus.PENDING,
            OrderStatus.ACCEPTED,
            OrderStatus.IN_PROGRESS,
            OrderStatus.COMBINED_ORDER
    );

    private final ProductOrderRepository productOrderRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final UserRepository userRepository;

    public OperationsDashboardResponse getDashboard() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long activeDeliveries = productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.OUT_FOR_DELIVERY));
        long availablePartners = userRepository.countByRoleAndStatus(Role.DELIVERY_PARTNER, UserStatus.ACTIVE);

        return new OperationsDashboardResponse(
                productOrderRepository.countByStatusIn(ACTIVE_PRODUCT_STATUSES),
                productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.PENDING, ProductOrderStatus.CONFIRMED)),
                productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.PACKING, ProductOrderStatus.READY_FOR_PICKUP)),
                productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.OUT_FOR_DELIVERY)),
                countDelayedProductOrders() + countDelayedServiceJobs(),
                serviceOrderRepository.countByStatusIn(ACTIVE_SERVICE_STATUSES),
                serviceOrderRepository.countByStatus(OrderStatus.PENDING),
                serviceOrderRepository.countDistinctActivePlumbers(ACTIVE_SERVICE_STATUSES),
                productOrderRepository.countByServiceOrderIsNotNullAndStatusIn(List.of(ProductOrderStatus.PENDING, ProductOrderStatus.CONFIRMED)),
                activeDeliveries,
                availablePartners,
                productOrderRepository.countByStatusAndCreatedAtBetween(ProductOrderStatus.CANCELLED, startOfDay, endOfDay)
                        + serviceOrderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CANCELLED, startOfDay, endOfDay),
                productOrderRepository.countByStatusAndCreatedAtBetween(ProductOrderStatus.DELIVERED, startOfDay, endOfDay)
                        + serviceOrderRepository.countByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, startOfDay, endOfDay)
        );
    }

    public Page<OperationsProductOrderSummary> listProductOrders(ProductOrderStatus status, String search, Long storeId, int page, int size) {
        return productOrderRepository.findAll(productOrderSpec(status, search, storeId), pageable(page, size))
                .map(this::toProductSummary);
    }

    public OperationsProductOrderDetail getProductOrder(Long id) {
        ProductOrder order = productOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product order not found"));
        return toProductDetail(order);
    }

    public Page<OperationsServiceJobSummary> listServiceJobs(OrderStatus status, String search, Long plumberId, Long customerId, int page, int size) {
        return serviceOrderRepository.findAll(serviceJobSpec(status, search, plumberId, customerId), pageable(page, size))
                .map(this::toServiceSummary);
    }

    public OperationsServiceJobDetail getServiceJob(Long id) {
        ServiceOrder job = serviceOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service job not found"));
        return toServiceDetail(job);
    }

    public Page<OperationsMaterialRequestSummary> listMaterialRequests(ProductOrderStatus status, Long plumberId, Long orderId, int page, int size) {
        return productOrderRepository.findAll(materialRequestSpec(status, plumberId, orderId), pageable(page, size))
                .map(this::toMaterialSummary);
    }

    public List<AvailableDeliveryPartnerResponse> listAvailableDeliveryPartners() {
        return userRepository.findAll((root, query, cb) -> cb.and(
                        cb.equal(root.get("role"), Role.DELIVERY_PARTNER),
                        cb.equal(root.get("status"), UserStatus.ACTIVE)
                ), Sort.by(Sort.Direction.ASC, "fullName"))
                .stream()
                .map(partner -> {
                    long activeLoad = productOrderRepository.countByDeliveryPartnerIdAndStatusIn(partner.getId(), List.of(ProductOrderStatus.OUT_FOR_DELIVERY));
                    return new AvailableDeliveryPartnerResponse(
                            partner.getId(),
                            partner.getFullName(),
                            partner.getPhone(),
                            activeLoad == 0 ? "AVAILABLE" : "BUSY",
                            null,
                            activeLoad
                    );
                })
                .toList();
    }

    @Transactional
    public OperationsServiceJobSummary reassignPlumber(Long jobId, ReassignPlumberRequest request) {
        if (request == null || request.plumberId() == null || isBlank(request.reason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "plumberId and reason are required");
        }
        ServiceOrder job = serviceOrderRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service job not found"));
        if (job.getStatus() == OrderStatus.COMPLETED || job.getStatus() == OrderStatus.PAID || job.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot reassign completed or cancelled service jobs");
        }
        User plumber = userRepository.findById(request.plumberId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plumber not found"));
        if (plumber.getRole() != Role.PLUMBER || plumber.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New assignee must be an active plumber");
        }
        job.setPlumber(plumber);
        if (job.getStatus() == OrderStatus.PENDING) {
            job.setStatus(OrderStatus.ACCEPTED);
            job.setAcceptedAt(LocalDateTime.now());
        }
        return toServiceSummary(serviceOrderRepository.save(job));
    }

    @Transactional
    public OperationsProductOrderSummary reassignDelivery(Long orderId, ReassignDeliveryRequest request) {
        if (request == null || request.deliveryPartnerId() == null || isBlank(request.reason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "deliveryPartnerId and reason are required");
        }
        ProductOrder order = productOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product order not found"));
        if (order.getStatus() == ProductOrderStatus.DELIVERED || order.getStatus() == ProductOrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot reassign completed or cancelled deliveries");
        }
        User partner = userRepository.findById(request.deliveryPartnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery partner not found"));
        if (partner.getRole() != Role.DELIVERY_PARTNER || partner.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New assignee must be an active delivery partner");
        }
        order.setDeliveryPartner(partner);
        if (order.getStatus() == ProductOrderStatus.CONFIRMED || order.getStatus() == ProductOrderStatus.READY_FOR_PICKUP) {
            order.setStatus(ProductOrderStatus.OUT_FOR_DELIVERY);
        }
        if (order.getEstimatedDeliveryAt() == null) {
            order.setEstimatedDeliveryAt(LocalDateTime.now().plusMinutes(30));
        }
        return toProductSummary(productOrderRepository.save(order));
    }

    @Transactional
    public OperationsProductOrderSummary cancelProductOrder(Long orderId, OperationsCancelOrderRequest request) {
        if (request == null || isBlank(request.reason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required");
        }
        ProductOrder order = productOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product order not found"));
        if (order.getStatus() == ProductOrderStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel delivered orders");
        }
        order.setStatus(ProductOrderStatus.CANCELLED);
        return toProductSummary(productOrderRepository.save(order));
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id"));
    }

    private Specification<ProductOrder> productOrderSpec(ProductOrderStatus status, String search, Long storeId) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (storeId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("store").get("id"), storeId));
            }
            if (!isBlank(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("customer").get("fullName")), pattern),
                        cb.like(cb.lower(root.get("customer").get("phone")), pattern),
                        cb.like(cb.lower(root.get("store").get("name")), pattern)
                ));
            }
            return predicate;
        };
    }

    private Specification<ServiceOrder> serviceJobSpec(OrderStatus status, String search, Long plumberId, Long customerId) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (plumberId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("plumber").get("id"), plumberId));
            }
            if (customerId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("customer").get("id"), customerId));
            }
            if (!isBlank(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("customer").get("fullName")), pattern),
                        cb.like(cb.lower(root.get("customer").get("phone")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            return predicate;
        };
    }

    private Specification<ProductOrder> materialRequestSpec(ProductOrderStatus status, Long plumberId, Long orderId) {
        return (root, query, cb) -> {
            var predicate = cb.isNotNull(root.get("serviceOrder"));
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (plumberId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("serviceOrder").get("plumber").get("id"), plumberId));
            }
            if (orderId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("serviceOrder").get("id"), orderId));
            }
            return predicate;
        };
    }

    private OperationsProductOrderSummary toProductSummary(ProductOrder order) {
        return new OperationsProductOrderSummary(
                order.getId(),
                personName(order.getCustomer()),
                personPhone(order.getCustomer()),
                storeName(order.getStore()),
                order.getTotalAmount(),
                order.getStatus(),
                paymentStatus(order.getStatus()),
                order.getCreatedAt(),
                null,
                personName(order.getDeliveryPartner()),
                isProductDelayed(order)
        );
    }

    private OperationsProductOrderDetail toProductDetail(ProductOrder order) {
        User customer = order.getCustomer();
        Store store = order.getStore();
        User partner = order.getDeliveryPartner();
        return new OperationsProductOrderDetail(
                order.getId(),
                customer == null ? null : new OperationsProductOrderDetail.CustomerInfo(customer.getId(), customer.getFullName(), customer.getPhone(), customer.getEmail()),
                store == null ? null : new OperationsProductOrderDetail.StoreInfo(store.getId(), store.getName(), store.getAddress()),
                order.getTotalAmount(),
                order.getStatus(),
                paymentStatus(order.getStatus()),
                order.getCreatedAt(),
                null,
                order.getEstimatedDeliveryAt(),
                partner == null ? null : new OperationsProductOrderDetail.DeliveryPartnerInfo(partner.getId(), partner.getFullName(), partner.getPhone()),
                order.getServiceOrder() == null ? null : order.getServiceOrder().getId(),
                order.getItems().stream()
                        .map(item -> new OperationsProductOrderDetail.ItemInfo(
                                item.getProduct() == null ? null : item.getProduct().getId(),
                                item.getProduct() == null ? "UNKNOWN" : item.getProduct().getName(),
                                item.getQuantity(),
                                item.getPrice()
                        ))
                        .toList(),
                List.of(order.getStatus().name()),
                isProductDelayed(order)
        );
    }

    private OperationsServiceJobSummary toServiceSummary(ServiceOrder job) {
        return new OperationsServiceJobSummary(
                job.getId(),
                personName(job.getCustomer()),
                personPhone(job.getCustomer()),
                personName(job.getPlumber()),
                personPhone(job.getPlumber()),
                job.getRequestType(),
                job.getStatus(),
                job.getCreatedAt(),
                null,
                isServiceDelayed(job)
        );
    }

    private OperationsServiceJobDetail toServiceDetail(ServiceOrder job) {
        return new OperationsServiceJobDetail(
                job.getId(),
                toPersonInfo(job.getCustomer()),
                toPersonInfo(job.getPlumber()),
                job.getRequestType(),
                job.getDescription(),
                new OperationsServiceJobDetail.AddressInfo(job.getCustomerLatitude(), job.getCustomerLongitude()),
                job.getStatus(),
                job.getCreatedAt(),
                job.getAcceptedAt(),
                job.getStartedAt(),
                job.getCompletedAt(),
                productOrderRepository.findByServiceOrderId(job.getId()).stream().map(this::toMaterialSummary).toList(),
                List.of(),
                isServiceDelayed(job)
        );
    }

    private OperationsMaterialRequestSummary toMaterialSummary(ProductOrder order) {
        ServiceOrder serviceOrder = order.getServiceOrder();
        return new OperationsMaterialRequestSummary(
                order.getId(),
                serviceOrder == null ? null : serviceOrder.getId(),
                serviceOrder == null ? null : personName(serviceOrder.getPlumber()),
                serviceOrder == null ? personName(order.getCustomer()) : personName(serviceOrder.getCustomer()),
                storeName(order.getStore()),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCreatedAt()
        );
    }

    private OperationsServiceJobDetail.PersonInfo toPersonInfo(User user) {
        return user == null ? null : new OperationsServiceJobDetail.PersonInfo(user.getId(), user.getFullName(), user.getPhone(), user.getEmail());
    }

    private String paymentStatus(ProductOrderStatus status) {
        if (status == ProductOrderStatus.PENDING) {
            return "PENDING_PAYMENT";
        }
        if (status == ProductOrderStatus.FAILED || status == ProductOrderStatus.CANCELLED) {
            return "FAILED";
        }
        return "PAID";
    }

    private boolean isProductDelayed(ProductOrder order) {
        if (order.getStatus() == ProductOrderStatus.DELIVERED || order.getStatus() == ProductOrderStatus.CANCELLED) {
            return false;
        }
        if (order.getEstimatedDeliveryAt() != null) {
            return order.getEstimatedDeliveryAt().isBefore(LocalDateTime.now());
        }
        return order.getCreatedAt() != null && order.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24));
    }

    private boolean isServiceDelayed(ServiceOrder job) {
        if (job.getStatus() == OrderStatus.COMPLETED || job.getStatus() == OrderStatus.PAID || job.getStatus() == OrderStatus.CANCELLED) {
            return false;
        }
        return job.getCreatedAt() != null && job.getCreatedAt().isBefore(LocalDateTime.now().minusHours(4));
    }

    private long countDelayedProductOrders() {
        return productOrderRepository.findAll(productOrderSpec(null, null, null)).stream().filter(this::isProductDelayed).count();
    }

    private long countDelayedServiceJobs() {
        return serviceOrderRepository.findAll(serviceJobSpec(null, null, null, null)).stream().filter(this::isServiceDelayed).count();
    }

    private String personName(User user) {
        return user == null ? null : user.getFullName();
    }

    private String personPhone(User user) {
        return user == null ? null : user.getPhone();
    }

    private String storeName(Store store) {
        return store == null ? null : store.getName();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
