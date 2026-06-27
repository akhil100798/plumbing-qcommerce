package com.pqc.core.dto;
import com.pqc.core.entity.PlumberAvailabilityStatus;
public record PlumberAvailabilityUpdateRequest(PlumberAvailabilityStatus status,String reason) {}
