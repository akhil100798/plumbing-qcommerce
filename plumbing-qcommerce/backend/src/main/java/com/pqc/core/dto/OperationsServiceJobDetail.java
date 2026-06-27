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
        boolean delayFlag
) {
    public record PersonInfo(Long id, String name, String phone, String email) {
    }

    public record AddressInfo(Double latitude, Double longitude) {
    }
}
