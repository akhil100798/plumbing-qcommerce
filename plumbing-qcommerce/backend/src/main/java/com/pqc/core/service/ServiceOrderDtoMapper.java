package com.pqc.core.service;

import com.pqc.core.dto.*;
import com.pqc.core.entity.ServiceOrder;
import org.springframework.stereotype.Component;

@Component
public class ServiceOrderDtoMapper {
    public CustomerServiceOrderSummaryResponse customerSummary(ServiceOrder o) {
        return new CustomerServiceOrderSummaryResponse(o.getId(), o.getStatus(), o.getRequestType(), o.getDescription(),
                o.getTotalAmount(), o.getPlumber() == null ? null : o.getPlumber().getFullName(), o.getCreatedAt(), null);
    }

    public CustomerServiceOrderDetailResponse customerDetail(ServiceOrder o) {
        return new CustomerServiceOrderDetailResponse(o.getId(), o.getStatus(), o.getRequestType(), o.getDescription(),
                o.getIssueCategory(), o.getUrgency(), o.getScheduledFor(), o.getAddressLine1(), o.getAddressLine2(),
                o.getLandmark(), o.getCity(), o.getPostalCode(), o.getCustomerPhoneSnapshot(), o.getCustomerLatitude(), o.getCustomerLongitude(),
                o.getVisitFee(), o.getCurrency(), o.getLaborCharge(), o.getPartsCharge(),
                o.getPlatformFee(), o.getTotalAmount(), o.getPlumber() == null ? null : o.getPlumber().getFullName(),
                o.getPlumber() == null ? null : o.getPlumber().getPhone(), o.getCreatedAt(), o.getAcceptedAt(),
                o.getArrivedAt(), o.getStartedAt(), o.getCompletedAt(), null);
    }

    public PlumberJobSummaryResponse plumberSummary(ServiceOrder o) {
        return new PlumberJobSummaryResponse(o.getId(), o.getCustomer() == null ? null : o.getCustomer().getFullName(),
                o.getRequestType() == null ? null : o.getRequestType().name(), o.getStatus(), o.getTotalAmount(),
                o.getCreatedAt(), o.getCompletedAt());
    }

    public PlumberJobDetailResponse plumberDetail(ServiceOrder o) {
        return new PlumberJobDetailResponse(o.getId(), o.getStatus(), o.getRequestType(), o.getDescription(), o.getIssueCategory(), o.getUrgency(), o.getScheduledFor(),
                o.getAddressLine1(), o.getAddressLine2(), o.getLandmark(), o.getCity(), o.getPostalCode(), o.getCustomerLatitude(), o.getCustomerLongitude(), o.getCustomer() == null ? null : o.getCustomer().getFullName(),
                o.getCustomer() == null ? null : o.getCustomer().getPhone(), o.getTotalAmount(), o.getCreatedAt(),
                o.getAcceptedAt(), o.getArrivedAt(), o.getStartedAt(), o.getCompletedAt());
    }
}
