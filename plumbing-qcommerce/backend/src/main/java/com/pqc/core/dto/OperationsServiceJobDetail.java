package com.pqc.core.dto;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;

import java.time.LocalDateTime;
import java.util.List;

public record OperationsServiceJobDetail(
        Long jobId,
        PersonInfo customer,
        PersonInfo plumber,
        RequestType requestType,
        String description,
        AddressInfo address,
        OrderStatus status,
        LocalDateTime createdAt,
        LocalDateTime acceptedAt,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        List<OperationsMaterialRequestSummary> materialRequests,
        List<String> logs,
        List<AssignmentInfo> assignmentHistory,
        boolean delayFlag
) {
    public record PersonInfo(Long id, String name, String phone, String email) {
    }

    public record AddressInfo(Double latitude, Double longitude) {
    }

    public record AssignmentInfo(Long id, Long plumberId, String plumberName, String status,
                                 String assignmentMode, Long actorId, String actorRole,
                                 String reason, LocalDateTime createdAt) {}
}
