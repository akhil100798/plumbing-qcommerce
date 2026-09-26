package com.pqc.core.service;

import com.pqc.core.dto.ServiceOrderPhotoResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.ServiceOrderPhotoRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServiceOrderPhotoService {
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final ServiceOrderRepository orders;
    private final ServiceOrderPhotoRepository photos;
    private final CurrentUser currentUser;
    @Value("${app.photos.storage-dir:uploads/service-order-photos}")
    private String storageDirectory;

    @Transactional
    public ServiceOrderPhotoResponse upload(Long orderId, ServiceOrderPhotoPhase phase, MultipartFile file) {
        ServiceOrder order = assignedOrder(orderId);
        validateUpload(order, phase, file);
        String extension = switch (file.getContentType()) { case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; default -> ".webp"; };
        String storageKey = UUID.randomUUID() + extension;
        Path target = storagePath().resolve(storageKey).normalize();
        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store photo", e);
        }
        ServiceOrderPhoto saved = photos.save(ServiceOrderPhoto.builder().serviceOrder(order).phase(phase)
                .storageKey(storageKey).contentType(file.getContentType()).sizeBytes(file.getSize()).build());
        return ServiceOrderPhotoResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderPhotoResponse> list(Long orderId, ServiceOrderPhotoPhase phase) {
        assignedOrder(orderId);
        return photos.findByServiceOrder_IdAndPhaseOrderByCreatedAtAsc(orderId, phase).stream()
                .map(ServiceOrderPhotoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PhotoFile file(Long orderId, Long photoId) {
        assignedOrder(orderId);
        ServiceOrderPhoto photo = photos.findById(photoId).orElseThrow(() -> notFound("Photo not found"));
        if (!photo.getServiceOrder().getId().equals(orderId)) throw notFound("Photo not found");
        try {
            Resource resource = new UrlResource(storagePath().resolve(photo.getStorageKey()).normalize().toUri());
            if (!resource.exists() || !resource.isReadable()) throw notFound("Photo file not found");
            return new PhotoFile(resource, photo.getContentType());
        } catch (IOException e) { throw notFound("Photo file not found"); }
    }

    private ServiceOrder assignedOrder(Long orderId) {
        User user = currentUser.require();
        ServiceOrder order = orders.findById(orderId).orElseThrow(() -> notFound("Service order not found"));
        if (order.getPlumber() == null || !order.getPlumber().getId().equals(user.getId()))
            throw new AccessDeniedException("Only the assigned plumber can access job photos");
        return order;
    }

    private void validateUpload(ServiceOrder order, ServiceOrderPhotoPhase phase, MultipartFile file) {
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An image file is required");
        if (file.getSize() > MAX_FILE_SIZE) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must not exceed 5 MB");
        if (!ALLOWED_TYPES.contains(file.getContentType())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, and WebP images are allowed");
        if (phase == ServiceOrderPhotoPhase.BEFORE && order.getStatus() != OrderStatus.IN_PROGRESS)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Before photos require an active job");
        if (phase == ServiceOrderPhotoPhase.AFTER && !Set.of(OrderStatus.IN_PROGRESS, OrderStatus.WORK_RESUMED).contains(order.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "After photos require active or resumed work");
    }

    private Path storagePath() { return Path.of(storageDirectory).toAbsolutePath().normalize(); }
    private ResponseStatusException notFound(String message) { return new ResponseStatusException(HttpStatus.NOT_FOUND, message); }
    public record PhotoFile(Resource resource, String contentType) { }
}
