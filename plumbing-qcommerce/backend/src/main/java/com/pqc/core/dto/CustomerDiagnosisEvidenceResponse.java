package com.pqc.core.dto;

import com.pqc.core.entity.ServiceOrderPhoto;

import java.time.LocalDateTime;

/** Customer-safe diagnosis evidence. Storage details are intentionally absent. */
public record CustomerDiagnosisEvidenceResponse(
        Long photoId,
        String phase,
        String contentType,
        long sizeBytes,
        LocalDateTime createdAt,
        String binaryUrl) {
    public static CustomerDiagnosisEvidenceResponse from(ServiceOrderPhoto photo) {
        Long orderId = photo.getServiceOrder().getId();
        return new CustomerDiagnosisEvidenceResponse(
                photo.getId(), photo.getPhase().name(), photo.getContentType(), photo.getSizeBytes(),
                photo.getCreatedAt(), "/api/v1/customer/orders/" + orderId
                        + "/diagnosis/evidence/" + photo.getId() + "/file");
    }
}
