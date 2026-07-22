package com.pqc.core.controller;

import com.pqc.core.dto.MaterialRequestDetailResponse;
import com.pqc.core.dto.MaterialRequestSummaryResponse;
import com.pqc.core.dto.PlumberDashboardResponse;
import com.pqc.core.dto.PlumberEarningsResponse;
import com.pqc.core.entity.OrderStatus;
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

        boolean online = user.getAvailability() != null && user.getAvailability();
        Double rating = 4.8;

        PlumberDashboardResponse.UpcomingJobDto upcomingJobDto = null;
        if (upcomingOrder != null) {
            upcomingJobDto = PlumberDashboardResponse.UpcomingJobDto.builder()
                    .id(upcomingOrder.getId())
                    .code("FJKA" + upcomingOrder.getId())
                    .title(upcomingOrder.getDescription() != null ? upcomingOrder.getDescription() : "Plumbing Service")
                    .customerName(upcomingOrder.getCustomer() != null ? upcomingOrder.getCustomer().getFullName() : "Customer")
                    .address("Bengaluru")
                    .scheduledTime("Today, 10:30 AM")
                    .estimatedAmount(BigDecimal.valueOf(650))
                    .status(upcomingOrder.getStatus().name())
                    .build();
        }

        PlumberDashboardResponse resp = PlumberDashboardResponse.builder()
                .plumberId(user.getId())
                .name(user.getFullName() != null ? user.getFullName() : "Plumber Partner")
                .online(online)
                .rating(rating)
                .todayEarnings(BigDecimal.valueOf(2450))
                .completedJobs(completed > 0 ? completed : 2)
                .activeJobs(active)
                .assignedJobs(assigned > 0 ? assigned : 4)
                .cancelledJobs(cancelled)
                .upcomingJob(upcomingJobDto)
                .build();

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/earnings")
    public ResponseEntity<PlumberEarningsResponse> getEarnings() {
        PlumberEarningsResponse resp = PlumberEarningsResponse.builder()
                .todayEarnings(BigDecimal.valueOf(2450))
                .weeklyEarnings(BigDecimal.valueOf(8650))
                .serviceCommission(BigDecimal.valueOf(6800))
                .materialCommission(BigDecimal.valueOf(1250))
                .tips(BigDecimal.valueOf(600))
                .jobsCompleted(14)
                .build();

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        return ResponseEntity.ok(currentUser.require());
    }

    @GetMapping("/orders/{orderId}/material-request")
    public ResponseEntity<List<MaterialRequestSummaryResponse>> getMaterialRequestByOrder(@PathVariable Long orderId) {
        List<MaterialRequestSummaryResponse> response = plumberMaterialService.serviceOrderRequests(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/material-requests/{requestId}")
    public ResponseEntity<MaterialRequestDetailResponse> getMaterialRequestById(@PathVariable Long requestId) {
        MaterialRequestDetailResponse response = plumberMaterialService.plumberRequestDetails(requestId);
        return ResponseEntity.ok(response);
    }

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
}
