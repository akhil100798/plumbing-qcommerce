package com.pqc.core.dto;

import java.math.BigDecimal;

public record SuperAdminDashboardResponse(
        long totalCustomers,
        long totalPlumbers,
        long totalStoreManagers,
        long totalDeliveryPartners,
        long totalAdmins,
        long totalStores,
        long totalProductOrders,
        long totalServiceOrders,
        BigDecimal totalRevenue,
        long pendingOrders,
        long activeServiceJobs,
        long pendingMaterialRequests
) {
}
