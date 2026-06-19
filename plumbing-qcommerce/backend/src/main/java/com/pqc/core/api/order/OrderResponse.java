package com.pqc.core.api.order;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.ServiceOrder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        Long customerId,
        Long plumberId,
        Long storeId,
        OrderStatus status,
        RequestType requestType,
        String description,
        Double latitude,
        Double longitude,
        BigDecimal laborCharge,
        BigDecimal partsCharge,
        BigDecimal platformFee,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime acceptedAt,
        LocalDateTime startedAt,
        LocalDateTime completedAt
) {
    public static OrderResponse from(ServiceOrder order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomer().getId(),
                order.getPlumber() == null ? null : order.getPlumber().getId(),
                order.getStore() == null ? null : order.getStore().getId(),
                order.getStatus(),
                order.getRequestType(),
                order.getDescription(),
                order.getCustomerLatitude(),
                order.getCustomerLongitude(),
                order.getLaborCharge(),
                order.getPartsCharge(),
                order.getPlatformFee(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getAcceptedAt(),
                order.getStartedAt(),
                order.getCompletedAt());
    }
}
