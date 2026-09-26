package com.pqc.core.controller;

import com.pqc.core.dto.MaterialRequestDetailResponse;
import com.pqc.core.dto.MaterialRequestSummaryResponse;
import com.pqc.core.dto.PlumberDashboardResponse;
import com.pqc.core.dto.PlumberEarningsResponse;
import com.pqc.core.dto.PlumberKycDetailResponse;
import com.pqc.core.dto.PlumberKycSubmissionRequest;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.PlumberAvailabilityStatus;
import com.pqc.core.entity.PlumberKyc;
import com.pqc.core.entity.PlumberKycStatus;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.PlumberKycRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.PlumberMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/plumber")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLUMBER')")
public class PlumberController {

    private final CurrentUser currentUser;
    private final ServiceOrderRepository serviceOrderRepository;
    private final PlumberKycRepository plumberKycRepository;
    private final PlumberMaterialService plumberMaterialService;

    @GetMapping("/dashboard")
    public ResponseEntity<PlumberDashboardResponse> getDashboard() {
        User user = currentUser.require();
        List<ServiceOrder> orders = serviceOrderRepository.findByPlumber_Id(user.getId());

        int completed = 0;
        int active = 0;
        int assigned = 0;
        int cancelled = 0;
        ServiceOrder upcomingOrder = null;

        for (ServiceOrder o : orders) {
            if (o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.PAID) {
                completed++;
            } else if (o.getStatus() == OrderStatus.CANCELLED) {
                cancelled++;
            } else if (o.getStatus() == OrderStatus.PENDING) {
                assigned++;
                if (upcomingOrder == null) upcomingOrder = o;
            } else {
                active++;
                if (upcomingOrder == null) upcomingOrder = o;
            }
        }

        boolean online = plumberKycRepository.findByPlumberId(user.getId())
                .map(kyc -> kyc.getAvailabilityStatus() == PlumberAvailabilityStatus.ONLINE)
                .orElse(false);
        Double rating = orders.stream().map(ServiceOrder::getRating)
                .filter(java.util.Objects::nonNull).mapToInt(Integer::intValue).average()
                .stream().boxed().findFirst().orElse(null);

        PlumberDashboardResponse.UpcomingJobDto upcomingJobDto = null;
        if (upcomingOrder != null) {
            upcomingJobDto = PlumberDashboardResponse.UpcomingJobDto.builder()
                    .id(upcomingOrder.getId())
                    .code(String.valueOf(upcomingOrder.getId()))
                    .title(upcomingOrder.getDescription())
                    .customerName(upcomingOrder.getCustomer() == null ? null : upcomingOrder.getCustomer().getFullName())
                    .address(address(upcomingOrder))
                    .scheduledTime(upcomingOrder.getCreatedAt() == null ? null : upcomingOrder.getCreatedAt().toString())
                    .estimatedAmount(earningsFor(upcomingOrder))
                    .status(upcomingOrder.getStatus().name())
                    .build();
        }

        PlumberDashboardResponse resp = PlumberDashboardResponse.builder()
                .plumberId(user.getId())
                .name(user.getFullName())
                .online(online)
                .rating(rating)
                .todayEarnings(orders.stream().filter(this::isCompletedToday).map(this::earningsFor).reduce(BigDecimal.ZERO, BigDecimal::add))
                .completedJobs(completed)
                .activeJobs(active)
                .assignedJobs(assigned)
                .cancelledJobs(cancelled)
                .upcomingJob(upcomingJobDto)
                .build();

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/earnings")
    public ResponseEntity<PlumberEarningsResponse> getEarnings() {
        User user = currentUser.require();
        List<ServiceOrder> completed = serviceOrderRepository.findByPlumber_Id(user.getId()).stream()
                .filter(order -> order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.PAID).toList();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        PlumberEarningsResponse resp = PlumberEarningsResponse.builder()
                .todayEarnings(completed.stream().filter(order -> completedOn(order, today)).map(this::earningsFor).reduce(BigDecimal.ZERO, BigDecimal::add))
                .weeklyEarnings(completed.stream().filter(order -> completedOnOrAfter(order, weekStart)).map(this::earningsFor).reduce(BigDecimal.ZERO, BigDecimal::add))
                .serviceCommission(completed.stream().map(order -> nullSafe(order.getLaborCharge())).reduce(BigDecimal.ZERO, BigDecimal::add))
                .materialCommission(completed.stream().map(order -> nullSafe(order.getReferralCommission())).reduce(BigDecimal.ZERO, BigDecimal::add))
                .tips(BigDecimal.ZERO)
                .jobsCompleted(completed.size())
                .build();

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        return ResponseEntity.ok(currentUser.require());
    }

    @GetMapping("/kyc")
    public ResponseEntity<PlumberKycDetailResponse> getKyc() {
        User user = currentUser.require();
        return ResponseEntity.ok(toKycResponse(user, plumberKycRepository.findByPlumberId(user.getId()).orElse(null)));
    }

    @PostMapping("/kyc")
    public ResponseEntity<PlumberKycDetailResponse> submitKyc(@jakarta.validation.Valid @RequestBody PlumberKycSubmissionRequest request) {
        User user = currentUser.require();
        PlumberKyc kyc = plumberKycRepository.findByPlumberId(user.getId())
                .orElseGet(() -> PlumberKyc.builder().plumberId(user.getId()).build());
        if (kyc.getStatus() == PlumberKycStatus.PENDING || kyc.getStatus() == PlumberKycStatus.APPROVED) {
            return ResponseEntity.status(409).body(toKycResponse(user, kyc));
        }
        kyc.setAadhaarNumberMasked(mask(request.aadhaarNumber(), 4));
        kyc.setPanNumberMasked(mask(request.panNumber().toUpperCase(), 4));
        kyc.setBankAccountMasked(mask(request.bankAccountNumber(), 4));
        kyc.setExperienceYears(request.experienceYears());
        kyc.setServiceAreas(request.serviceAreas().trim());
        kyc.setDocumentStatus("UNDER_REVIEW");
        kyc.setStatus(PlumberKycStatus.PENDING);
        kyc.setSubmittedAt(LocalDateTime.now());
        kyc.setReviewedAt(null);
        kyc.setReviewedByAdminId(null);
        kyc.setRejectionReason(null);
        return ResponseEntity.status(201).body(toKycResponse(user, plumberKycRepository.save(kyc)));
    }


    @GetMapping("/orders/{orderId}/material-request")
    public ResponseEntity<List<MaterialRequestSummaryResponse>> getMaterialRequestByOrder(@PathVariable Long orderId) {
        List<MaterialRequestSummaryResponse> response = plumberMaterialService.serviceOrderRequests(orderId);
        return ResponseEntity.ok(response);
    }

    // Handled in MaterialPickupController to prevent Spring MVC route collision
    // @GetMapping("/material-requests/{requestId}")
    // public ResponseEntity<MaterialRequestDetailResponse> getMaterialRequestById(@PathVariable Long requestId) {
    //     MaterialRequestDetailResponse response = plumberMaterialService.plumberRequestDetails(requestId);
    //     return ResponseEntity.ok(response);
    // }

    @GetMapping("/material-requests/{requestId}/tracking")
    public ResponseEntity<List<Map<String, Object>>> getMaterialTracking(@PathVariable Long requestId) {
        List<Map<String, Object>> timeline = new ArrayList<>();
        timeline.add(Map.of("status", "REQUESTED", "time", "10:00 AM", "completed", true));
        timeline.add(Map.of("status", "APPROVED", "time", "10:15 AM", "completed", true));
        timeline.add(Map.of("status", "PICKED_UP", "time", "10:50 AM", "completed", true));
        timeline.add(Map.of("status", "ON_THE_WAY", "time", "11:05 AM", "completed", true));
        timeline.add(Map.of("status", "DELIVERED", "time", "Pending", "completed", false));

        return ResponseEntity.ok(timeline);
    }

    private PlumberKycDetailResponse toKycResponse(User user, PlumberKyc kyc) {
        if (kyc == null) {
            return new PlumberKycDetailResponse(null, user.getId(), user.getFullName(), user.getPhone(), user.getEmail(), null, null, null, null, null, null, PlumberKycStatus.NOT_SUBMITTED, null, null, null, null);
        }
        return new PlumberKycDetailResponse(kyc.getId(), user.getId(), user.getFullName(), user.getPhone(), user.getEmail(), kyc.getAadhaarNumberMasked(), kyc.getPanNumberMasked(), kyc.getBankAccountMasked(), kyc.getExperienceYears(), kyc.getServiceAreas(), kyc.getDocumentStatus(), kyc.getStatus(), kyc.getSubmittedAt(), kyc.getReviewedAt(), kyc.getReviewedByAdminId(), kyc.getRejectionReason());
    }

    private BigDecimal earningsFor(ServiceOrder order) {
        return nullSafe(order.getLaborCharge()).add(nullSafe(order.getReferralCommission()));
    }

    private BigDecimal nullSafe(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private boolean isCompletedToday(ServiceOrder order) { return completedOn(order, LocalDate.now()); }
    private boolean completedOn(ServiceOrder order, LocalDate date) { return order.getCompletedAt() != null && order.getCompletedAt().toLocalDate().equals(date); }
    private boolean completedOnOrAfter(ServiceOrder order, LocalDate date) { return order.getCompletedAt() != null && !order.getCompletedAt().toLocalDate().isBefore(date); }
    private String address(ServiceOrder order) { return order.getCustomerLatitude() == null || order.getCustomerLongitude() == null ? null : order.getCustomerLatitude() + "," + order.getCustomerLongitude(); }
    private String mask(String value, int visible) { return "*".repeat(Math.max(0, value.length() - visible)) + value.substring(Math.max(0, value.length() - visible)); }
}
