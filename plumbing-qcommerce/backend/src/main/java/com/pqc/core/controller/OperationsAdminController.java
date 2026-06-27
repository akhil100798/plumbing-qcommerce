package com.pqc.core.controller;

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
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.service.OperationsAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/operations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_ADMIN')")
public class OperationsAdminController {

    private final OperationsAdminService operationsAdminService;

    @GetMapping("/dashboard")
    public ResponseEntity<OperationsDashboardResponse> getDashboard() {
        return ResponseEntity.ok(operationsAdminService.getDashboard());
    }

    @GetMapping("/product-orders")
    public ResponseEntity<Page<OperationsProductOrderSummary>> getProductOrders(
            @RequestParam(required = false) ProductOrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(operationsAdminService.listProductOrders(status, search, storeId, page, size));
    }

    @GetMapping("/product-orders/{id}")
    public ResponseEntity<OperationsProductOrderDetail> getProductOrder(@PathVariable Long id) {
        return ResponseEntity.ok(operationsAdminService.getProductOrder(id));
    }

    @GetMapping("/service-jobs")
    public ResponseEntity<Page<OperationsServiceJobSummary>> getServiceJobs(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long plumberId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(operationsAdminService.listServiceJobs(status, search, plumberId, customerId, page, size));
    }

    @GetMapping("/service-jobs/{id}")
    public ResponseEntity<OperationsServiceJobDetail> getServiceJob(@PathVariable Long id) {
        return ResponseEntity.ok(operationsAdminService.getServiceJob(id));
    }

    @GetMapping("/material-requests")
    public ResponseEntity<Page<OperationsMaterialRequestSummary>> getMaterialRequests(
            @RequestParam(required = false) ProductOrderStatus status,
            @RequestParam(required = false) Long plumberId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(operationsAdminService.listMaterialRequests(status, plumberId, orderId, page, size));
    }

    @GetMapping("/delivery-partners/available")
    public ResponseEntity<List<AvailableDeliveryPartnerResponse>> getAvailableDeliveryPartners() {
        return ResponseEntity.ok(operationsAdminService.listAvailableDeliveryPartners());
    }

    @PatchMapping("/service-jobs/{jobId}/reassign-plumber")
    public ResponseEntity<OperationsServiceJobSummary> reassignPlumber(
            @PathVariable Long jobId,
            @RequestBody ReassignPlumberRequest request
    ) {
        return ResponseEntity.ok(operationsAdminService.reassignPlumber(jobId, request));
    }

    @PatchMapping("/product-orders/{orderId}/reassign-delivery")
    public ResponseEntity<OperationsProductOrderSummary> reassignDelivery(
            @PathVariable Long orderId,
            @RequestBody ReassignDeliveryRequest request
    ) {
        return ResponseEntity.ok(operationsAdminService.reassignDelivery(orderId, request));
    }

    @PatchMapping("/product-orders/{orderId}/cancel")
    public ResponseEntity<OperationsProductOrderSummary> cancelProductOrder(
            @PathVariable Long orderId,
            @RequestBody OperationsCancelOrderRequest request
    ) {
        return ResponseEntity.ok(operationsAdminService.cancelProductOrder(orderId, request));
    }
}
