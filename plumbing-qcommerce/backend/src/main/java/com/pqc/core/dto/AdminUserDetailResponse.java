package com.pqc.core.dto;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.UserStatus;

import java.time.LocalDateTime;

public record AdminUserDetailResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        UserStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastActiveAt,
        LinkedStoreSummary linkedStore,
        ActivitySummary activitySummary
) {
    public record LinkedStoreSummary(Long id, String name, String address) {
    }

    public record ActivitySummary(
            long productOrders,
            long serviceJobs,
            long deliveries,
            long managedStores
    ) {
    }
}
