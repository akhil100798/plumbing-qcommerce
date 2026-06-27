package com.pqc.core.dto;

import com.pqc.core.entity.ProductOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OperationsProductOrderDetail(
        Long orderId,
        CustomerInfo customer,
        StoreInfo store,
        BigDecimal totalAmount,
        ProductOrderStatus status,
        String paymentStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime estimatedDeliveryAt,
        DeliveryPartnerInfo deliveryPartner,
        Long linkedServiceOrderId,
        List<ItemInfo> items,
        List<String> statusHistory,
        boolean delayFlag
) {
    public record CustomerInfo(Long id, String name, String phone, String email) {
    }

    public record StoreInfo(Long id, String name, String address) {
    }

    public record DeliveryPartnerInfo(Long id, String name, String phone) {
    }

    public record ItemInfo(Long productId, String productName, Integer quantity, BigDecimal price) {
    }
}
