package com.pqc.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetailDTO {
    private Long id;
    private Long customerId;
    private Long storeId;
    private String storeName;
    private BigDecimal totalAmount;
    private String status;
    private String deliveryPartnerName;
    private String deliveryPartnerPhone;
    private String deliveryOtp;
    private LocalDateTime estimatedDeliveryAt;
    private LocalDateTime createdAt;
    private List<OrderItemDetail> items;
    private Long serviceOrderId;
    private String serviceOrderStatus;
    private String assignedPlumberName;
    private String assignedPlumberPhone;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDetail {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
    }
}
