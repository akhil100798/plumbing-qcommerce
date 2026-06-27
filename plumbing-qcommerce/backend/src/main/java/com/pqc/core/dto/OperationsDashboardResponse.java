package com.pqc.core.dto;

public record OperationsDashboardResponse(
        long activeProductOrders,
        long pendingProductOrders,
        long packedOrders,
        long outForDeliveryOrders,
        long delayedOrders,
        long activeServiceJobs,
        long pendingServiceJobs,
        long plumbersOnJob,
        long pendingMaterialRequests,
        long activeDeliveries,
        long availableDeliveryPartners,
        long cancelledToday,
        long completedToday
) {
}
