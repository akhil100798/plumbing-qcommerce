package com.pqc.core.controller;

import com.pqc.core.dto.CheckoutRequest;
import com.pqc.core.dto.OrderDetailDTO;
import com.pqc.core.dto.OrderDetailResponse;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.CheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final CurrentUser currentUser;
    private final ProductOrderRepository productOrderRepository;

    @PostMapping("/reserve")
    public ResponseEntity<ProductOrder> reserveStock(@jakarta.validation.Valid @RequestBody CheckoutRequest request) {
        Long customerId = currentUser.require().getId();
        ProductOrder order = checkoutService.reserveStock(customerId, request.getStoreId(), request.getItems());
        return ResponseEntity.ok(order);
    }

    @PostMapping("/confirm/{orderId}")
    public ResponseEntity<String> confirmPayment(@PathVariable Long orderId) {
        checkoutService.confirmPayment(orderId);
        return ResponseEntity.ok("Payment confirmed and stock reservation finalized.");
    }

    @PostMapping("/release/{orderId}")
    public ResponseEntity<String> releaseReservation(@PathVariable Long orderId) {
        checkoutService.releaseReservation(orderId);
        return ResponseEntity.ok("Stock reservation released back to inventory.");
    }

    @GetMapping("/orders/status/{status}")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<OrderDetailResponse>> getOrdersByStatus(@PathVariable ProductOrderStatus status) {
        User user = currentUser.require();
        List<ProductOrder> orders;

        if (user.getRole() == Role.ADMIN) {
            orders = productOrderRepository.findByStatus(status);
        } else if (user.getRole() == Role.STORE_MANAGER) {
            orders = productOrderRepository.findAll().stream()
                    .filter(order -> order.getStore() != null)
                    .filter(order -> order.getStore().getManager() != null)
                    .filter(order -> order.getStore().getManager().getId().equals(user.getId()))
                    .filter(order -> order.getStatus() == status)
                    .toList();
        } else {
            throw new AccessDeniedException("Only store managers and admins can list product orders by status");
        }

        return ResponseEntity.ok(orders.stream()
                .map(checkoutService::mapToResponse)
                .toList());
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDetailDTO> getOrderById(@PathVariable Long id) {
        User user = currentUser.require();
        ProductOrder order = productOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));

        if (!order.getCustomer().getId().equals(user.getId())
                && (order.getDeliveryPartner() == null || !order.getDeliveryPartner().getId().equals(user.getId()))
                && user.getRole() != Role.ADMIN
                && user.getRole() != Role.STORE_MANAGER) {
            throw new AccessDeniedException("Access denied to this order");
        }

        List<OrderDetailDTO.OrderItemDetail> items = order.getItems().stream()
                .map(item -> OrderDetailDTO.OrderItemDetail.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName() : "Unknown")
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .toList();

        OrderDetailDTO.OrderDetailDTOBuilder builder = OrderDetailDTO.builder()
                .id(order.getId())
                .customerId(order.getCustomer().getId())
                .storeId(order.getStore().getId())
                .storeName(order.getStore().getName())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .deliveryPartnerName(order.getDeliveryPartner() != null ? order.getDeliveryPartner().getFullName() : null)
                .deliveryPartnerPhone(order.getDeliveryPartner() != null ? order.getDeliveryPartner().getPhone() : null)
                .deliveryOtp(null)
                .estimatedDeliveryAt(order.getEstimatedDeliveryAt())
                .createdAt(order.getCreatedAt())
                .items(items);

        if (order.getServiceOrder() != null) {
            ServiceOrder so = order.getServiceOrder();
            builder.serviceOrderId(so.getId())
                    .serviceOrderStatus(so.getStatus().name())
                    .assignedPlumberName(so.getPlumber() != null ? so.getPlumber().getFullName() : null)
                    .assignedPlumberPhone(so.getPlumber() != null ? so.getPlumber().getPhone() : null);
        }

        return ResponseEntity.ok(builder.build());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<ProductOrder>> getMyOrders() {
        User user = currentUser.require();
        return ResponseEntity.ok(productOrderRepository.findByCustomerId(user.getId()));
    }

    @GetMapping("/material-requests/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderDetailResponse>> getCustomerMaterialRequests() {
        User user = currentUser.require();
        return ResponseEntity.ok(productOrderRepository.findByCustomerIdAndServiceOrderIsNotNull(user.getId()).stream()
                .map(checkoutService::mapToResponse)
                .toList());
    }

    @GetMapping("/material-requests/plumber")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<OrderDetailResponse>> getPlumberMaterialRequests() {
        User user = currentUser.require();
        return ResponseEntity.ok(productOrderRepository.findByServiceOrder_Plumber_Id(user.getId()).stream()
                .map(checkoutService::mapToResponse)
                .toList());
    }

    @GetMapping("/material-requests/store")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<OrderDetailResponse>> getStoreMaterialRequests() {
        User user = currentUser.require();
        List<ProductOrder> orders = user.getRole() == Role.ADMIN
                ? productOrderRepository.findAll().stream()
                .filter(order -> order.getServiceOrder() != null)
                .toList()
                : productOrderRepository.findByStore_Manager_IdAndServiceOrderIsNotNull(user.getId());

        return ResponseEntity.ok(orders.stream()
                .filter(order -> order.getStatus() != ProductOrderStatus.PENDING)
                .filter(order -> order.getStatus() != ProductOrderStatus.CANCELLED)
                .map(checkoutService::mapToResponse)
                .toList());
    }

    @PatchMapping("/orders/{id}/accept")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<OrderDetailResponse> acceptOrder(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.OrderActionRequest request) {
        return ResponseEntity.ok(checkoutService.acceptOrder(id, request));
    }

    @PatchMapping("/orders/{id}/pack")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<OrderDetailResponse> packOrder(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.PackOrderRequest request) {
        return ResponseEntity.ok(checkoutService.packOrder(id, request));
    }

    @PostMapping("/orders/{id}/handover")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<OrderDetailResponse> handoverOrder(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.HandoverRequest request) {
        return ResponseEntity.ok(checkoutService.handoverOrder(id, request));
    }
}
