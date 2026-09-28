package com.pqc.core.dto;

import com.pqc.core.entity.ServiceOrderPhoto;

import java.time.LocalDateTime;

public record ServiceOrderPhotoResponse(Long id, String phase, String url, String contentType, long sizeBytes,
                                        LocalDateTime createdAt) {
    public static ServiceOrderPhotoResponse from(ServiceOrderPhoto photo) {
        Long orderId = photo.getServiceOrder().getId();
        return new ServiceOrderPhotoResponse(photo.getId(), photo.getPhase().name(),
                "/api/v1/orders/" + orderId + "/photos/" + photo.getId() + "/file",
                photo.getContentType(), photo.getSizeBytes(), photo.getCreatedAt());
    }
}
