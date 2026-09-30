package com.pqc.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pqc.core.entity.ServiceOrderAssignmentMode;
import com.pqc.core.entity.ServiceOrderAssignmentStatus;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ServiceOrderAssignmentResponse(
        Long id, Long serviceOrderId, Long plumberId, String plumberName,
        ServiceOrderAssignmentStatus status, ServiceOrderAssignmentMode assignmentMode,
        Long actorId, String actorRole, String reason, LocalDateTime createdAt) {}
