package com.pqc.core.dto;
import com.pqc.core.entity.OrderStatus; import java.math.BigDecimal; import java.time.LocalDateTime;
public record PlumberJobSummaryResponse(Long jobId,String customerName,String requestType,OrderStatus status,BigDecimal amount,LocalDateTime createdAt,LocalDateTime completedAt) {}
