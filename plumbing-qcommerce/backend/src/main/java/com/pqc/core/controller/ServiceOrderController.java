package com.pqc.core.controller;

import com.pqc.core.dto.CreateOrderRequest;
import com.pqc.core.dto.CustomerConfirmationResponse;
import com.pqc.core.dto.RatingRequest;
import com.pqc.core.dto.RatingResponse;
import com.pqc.core.dto.ServiceOrderStatusHistoryResponse;
import com.pqc.core.dto.CustomerServiceOrderSummaryResponse;
import com.pqc.core.dto.PlumberJobDetailResponse;
import com.pqc.core.dto.PlumberJobSummaryResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.service.ServiceOrderService;
import com.pqc.core.service.ServiceOrderPhotoService;
import com.pqc.core.service.ServiceOrderDtoMapper;
import com.pqc.core.service.ServiceOrderAssignmentService;
import com.pqc.core.entity.ServiceOrderPhotoPhase;
import com.pqc.core.dto.ServiceOrderPhotoResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class ServiceOrderController {

    private final ServiceOrderService orderService;
    private final ServiceOrderPhotoService photoService;
    private final CurrentUser currentUser;
    private final ServiceOrderDtoMapper orderDtoMapper;
    private final ServiceOrderAssignmentService assignmentService;

    /**
     * POST /api/v1/orders — Customer creates a service request.
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest req) {
        String validationError = validateCreateRequest(req);
        if (validationError != null) return ResponseEntity.badRequest().body(Map.of("error", validationError));
        RequestType type;
        try {
            String rt = req.getRequestType() != null ? req.getRequestType() : "NEARBY_AUTO";
            type = RequestType.valueOf(rt.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid requestType. Valid values: NEARBY_AUTO, STORE_ROUTED, DIRECT_PLUMBER"
            ));
        }

        Long customerId = currentUser.require().getId();
        return ResponseEntity.ok(orderDtoMapper.customerDetail(orderService.createOrder(
                customerId, req.getIssueCategory(), req.getDescription(), req.getLatitude(), req.getLongitude(), type,
                req.getAddressLine1(), req.getAddressLine2(), req.getLandmark(), req.getCity(), req.getPostalCode(),
                req.getContactPhone(), req.getUrgency(), req.getScheduledFor())));
    }

    /** PATCH/POST /api/v1/orders/{id}/accept — Plumber accepts */
    @RequestMapping(value = "/{id}/accept", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberJobDetailResponse> acceptOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderDtoMapper.plumberDetail(orderService.acceptOrder(id, currentUser.require().getId())));
    }

    /** PATCH/POST /api/v1/orders/{id}/reject - Plumber declines their offer */
    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberJobDetailResponse> rejectOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderDtoMapper.plumberDetail(orderService.rejectOrder(id, currentUser.require().getId())));
    }

    /** PATCH/POST /api/v1/orders/{id}/arrive — Plumber marks arrival */
    @RequestMapping(value = "/{id}/arrive", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<PlumberJobDetailResponse> arriveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderDtoMapper.plumberDetail(orderService.arriveOrder(id)));
    }

    /** PATCH/POST /api/v1/orders/{id}/start-navigation or /on-the-way */
    @RequestMapping(value = {"/{id}/start-navigation", "/{id}/on-the-way"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<PlumberJobDetailResponse> startNavigation(@PathVariable Long id) {
        return ResponseEntity.ok(orderDtoMapper.plumberDetail(orderService.getOrderById(id)));
    }

    /** PATCH/POST /api/v1/orders/{id}/start or /start-work — Plumber marks work started */
    @RequestMapping(value = {"/{id}/start", "/{id}/start-work"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<PlumberJobDetailResponse> startOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderDtoMapper.plumberDetail(orderService.startOrder(id)));
    }

    /** POST /api/v1/orders/{id}/photos/before */
    @PostMapping("/{id}/photos/before")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrderPhotoResponse> uploadBeforePhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(photoService.upload(id, ServiceOrderPhotoPhase.BEFORE, file));
    }

    /** POST /api/v1/orders/{id}/photos/after */
    @PostMapping("/{id}/photos/after")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrderPhotoResponse> uploadAfterPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(photoService.upload(id, ServiceOrderPhotoPhase.AFTER, file));
    }

    @GetMapping("/{id}/photos/{phase}")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<List<ServiceOrderPhotoResponse>> listPhotos(@PathVariable Long id, @PathVariable ServiceOrderPhotoPhase phase) {
        return ResponseEntity.ok(photoService.list(id, phase));
    }

    @GetMapping("/{id}/photos/{photoId}/file")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<Resource> photoFile(@PathVariable Long id, @PathVariable Long photoId) {
        ServiceOrderPhotoService.PhotoFile file = photoService.file(id, photoId);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType())).body(file.resource());
    }

    /** GET /api/v1/orders/plumber/history — Get current plumber's job history */
    @GetMapping("/plumber/history")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<PlumberJobSummaryResponse>> getPlumberHistory() {
        return ResponseEntity.ok(orderService.getOrdersByPlumber(currentUser.require().getId()).stream()
                .map(orderDtoMapper::plumberSummary).toList());
    }

    @GetMapping("/plumber/jobs/offers")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<PlumberJobSummaryResponse>> getPlumberOffers() {
        return ResponseEntity.ok(orderService.getOrdersByStatus(OrderStatus.PENDING).stream()
                .map(orderDtoMapper::plumberSummary).toList());
    }

    @GetMapping("/{id}/assignment-history")
    @PreAuthorize("@orderAuthorization.canRead(#id, authentication)")
    public ResponseEntity<List<com.pqc.core.dto.ServiceOrderAssignmentResponse>> assignmentHistory(@PathVariable Long id) {
        var order = orderService.getOrderById(id);
        var history = assignmentService.history(id);
        var actor = currentUser.require();
        if (actor.getRole() == com.pqc.core.entity.Role.ADMIN || actor.getRole() == com.pqc.core.entity.Role.SUPER_ADMIN || actor.getRole() == com.pqc.core.entity.Role.OPERATIONS_ADMIN) {
            return ResponseEntity.ok(history.stream().map(a -> toAssignmentResponse(a)).toList());
        }
        return ResponseEntity.ok(history.stream().map(a -> new com.pqc.core.dto.ServiceOrderAssignmentResponse(
                a.getId(), a.getServiceOrderId(), a.getPlumberId(), assignmentPlumberName(a.getPlumberId()),
                a.getStatus(), a.getAssignmentMode(), null, null, null, a.getCreatedAt())).toList());
    }

    /** POST/PATCH /api/v1/orders/{id}/complete — Plumber completes job */
    @RequestMapping(value = "/{id}/complete", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<PlumberJobDetailResponse> completeOrder(@PathVariable Long id,
                                                       @RequestParam(required = false) BigDecimal partsCharge) {
        return ResponseEntity.ok(orderDtoMapper.plumberDetail(orderService.completeOrder(id, partsCharge)));
    }

    /** POST/PATCH /api/v1/orders/{id}/confirm — Customer confirms completion */
    @RequestMapping(value = "/{id}/confirm", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerConfirmationResponse> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.confirmOrder(id));
    }

    /** POST /api/v1/orders/{id}/rating — Customer submits rating and comment */
    @PostMapping("/{id}/rating")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<RatingResponse> submitRating(@PathVariable Long id, @RequestBody RatingRequest req) {
        return ResponseEntity.ok(orderService.submitRating(id, req.getRating(), req.getComment()));
    }

    /** GET /api/v1/orders/{id}/rating — Retrieve rating for order */
    @GetMapping("/{id}/rating")
    public ResponseEntity<RatingResponse> getRating(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getRating(id));
    }

    /** GET /api/v1/orders/{id}/history — Retrieve status history for order */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ServiceOrderStatusHistoryResponse>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getHistory(id));
    }

    /** PATCH /api/v1/orders/{id}/cancel */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("@orderAuthorization.canCancel(#id, authentication)")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, @RequestParam(required = false) String reason) {
        ServiceOrder order = orderService.cancelOrder(id, reason);
        return ResponseEntity.ok(orderDtoMapper.customerDetail(order));
    }

    private com.pqc.core.dto.ServiceOrderAssignmentResponse toAssignmentResponse(com.pqc.core.entity.ServiceOrderAssignment a) {
        return new com.pqc.core.dto.ServiceOrderAssignmentResponse(a.getId(), a.getServiceOrderId(), a.getPlumberId(), assignmentPlumberName(a.getPlumberId()), a.getStatus(), a.getAssignmentMode(), a.getActorId(), a.getActorRole(), a.getReason(), a.getCreatedAt());
    }

    private String assignmentPlumberName(Long plumberId) {
        return plumberId == null ? null : orderService.findUserName(plumberId);
    }

    private String validateCreateRequest(CreateOrderRequest req) {
        if (req == null || req.getDescription() == null || req.getDescription().isBlank() || req.getDescription().trim().length() > 2000) return "description is required and must be at most 2000 characters";
        if (req.getIssueCategory() == null || !Set.of("pipe", "tap", "toilet", "tank", "motor", "other").contains(req.getIssueCategory().toLowerCase())) return "Invalid issueCategory";
        if (req.getUrgency() != null && !Set.of("NORMAL", "URGENT").contains(req.getUrgency().toUpperCase())) return "Invalid urgency";
        if (req.getScheduledFor() != null && !req.getScheduledFor().isAfter(java.time.LocalDateTime.now())) return "scheduledFor must be in the future";
        if (req.getAddressLine1() == null || req.getAddressLine1().isBlank()) return "addressLine1 is required";
        if (req.getCity() == null || req.getCity().isBlank()) return "city is required";
        if (req.getPostalCode() == null || !req.getPostalCode().matches("\\d{5,6}")) return "postalCode must be 5 or 6 digits";
        if (req.getContactPhone() != null && !req.getContactPhone().matches("^\\+?[0-9][0-9 ()-]{7,19}$")) return "Invalid contactPhone";
        if ((req.getLatitude() != null && (req.getLatitude() < -90 || req.getLatitude() > 90 || !Double.isFinite(req.getLatitude()))) || (req.getLongitude() != null && (req.getLongitude() < -180 || req.getLongitude() > 180 || !Double.isFinite(req.getLongitude())))) return "Invalid service coordinates";
        return null;
    }

    /** GET /api/v1/orders/customer/{customerId} */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("@orderAuthorization.canReadCustomer(#customerId, authentication)")
    public ResponseEntity<List<CustomerServiceOrderSummaryResponse>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId).stream()
                .map(orderDtoMapper::customerSummary).toList());
    }

    /** GET /api/v1/orders/plumber — Get current plumber's service orders */
    @GetMapping("/plumber")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<PlumberJobSummaryResponse>> getByPlumber() {
        return ResponseEntity.ok(orderService.getOrdersByPlumber(currentUser.require().getId()).stream()
                .map(orderDtoMapper::plumberSummary).toList());
    }

    /** GET /api/v1/orders/status/{status} — For store manager dashboard */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('PLUMBER', 'STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<?> getByStatus(@PathVariable String status) {
        List<ServiceOrder> orders = orderService.getOrdersByStatus(OrderStatus.valueOf(status.toUpperCase()));
        return currentUser.require().getRole() == com.pqc.core.entity.Role.PLUMBER
                ? ResponseEntity.ok(orders.stream().map(orderDtoMapper::plumberSummary).toList())
                : ResponseEntity.ok(orders.stream().map(orderDtoMapper::customerSummary).toList());
    }

    /** GET /api/v1/orders/{id} */
    @GetMapping("/{id}")
    @PreAuthorize("@orderAuthorization.canRead(#id, authentication)")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        ServiceOrder order = orderService.getOrderById(id);
        return switch (currentUser.require().getRole()) {
            case CUSTOMER -> ResponseEntity.ok(orderDtoMapper.customerDetail(order));
            case PLUMBER -> ResponseEntity.ok(orderDtoMapper.plumberDetail(order));
            default -> ResponseEntity.ok(order);
        };
    }
}

