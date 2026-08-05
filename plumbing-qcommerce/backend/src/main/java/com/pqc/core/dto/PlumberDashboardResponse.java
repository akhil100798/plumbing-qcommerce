package com.pqc.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlumberDashboardResponse {
    private Long plumberId;
    private String name;
    private boolean online;
    private Double rating;
    private BigDecimal todayEarnings;
    private int completedJobs;
    private int activeJobs;
    private int assignedJobs;
    private int cancelledJobs;
    private UpcomingJobDto upcomingJob;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingJobDto {
        private Long id;
        private String code;
        private String title;
        private String customerName;
        private String address;
        private String scheduledTime;
        private BigDecimal estimatedAmount;
        private String status;
    }
}
