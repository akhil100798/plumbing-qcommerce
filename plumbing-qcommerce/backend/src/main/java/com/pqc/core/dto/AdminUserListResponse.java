package com.pqc.core.dto;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.UserStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AdminUserListResponse(
        List<UserSummary> users,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public record UserSummary(
            Long id,
            String fullName,
            String email,
            String phone,
            Role role,
            UserStatus status,
            LocalDateTime createdAt,
            LocalDateTime lastActiveAt
    ) {
    }
}
