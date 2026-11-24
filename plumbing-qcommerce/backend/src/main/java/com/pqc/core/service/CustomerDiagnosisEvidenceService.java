package com.pqc.core.service;

import com.pqc.core.dto.CustomerDiagnosisEvidenceResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.ServiceOrderPhotoRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.ServiceDiagnosisEvidenceRepository;
import com.pqc.core.repository.ServiceDiagnosisRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.nio.file.Path;

/** Customer-safe diagnosis evidence boundary. It never exposes storage keys. */
@Service
@RequiredArgsConstructor
public class CustomerDiagnosisEvidenceService {
    private final ServiceOrderRepository orders;
    private final ServiceOrderPhotoRepository photos;
    private ServiceDiagnosisRepository diagnoses;
    private ServiceDiagnosisEvidenceRepository evidence;
    private final CurrentUser currentUser;
    @Value("${app.photos.storage-dir:uploads/service-order-photos}")
    private String storageDirectory;

    @Autowired
    void setDiagnosisRepositories(ServiceDiagnosisRepository diagnoses, ServiceDiagnosisEvidenceRepository evidence) {
        this.diagnoses = diagnoses;
        this.evidence = evidence;
    }

    @Transactional(readOnly = true)
    public List<CustomerDiagnosisEvidenceResponse> list(Long orderId) {
        requireOwner(orderId);
        if (diagnoses == null || evidence == null) {
            return photos.findByServiceOrder_IdAndPhaseOrderByCreatedAtAsc(orderId, ServiceOrderPhotoPhase.DIAGNOSIS)
                    .stream().map(CustomerDiagnosisEvidenceResponse::from).toList();
        }
        return diagnoses.findCurrent(orderId, java.util.Set.of(DiagnosisState.SUBMITTED)).stream()
                .findFirst()
                .map(d -> evidence.findWithPhoto(d.getId()).stream().map(e -> CustomerDiagnosisEvidenceResponse.from(e.getPhoto())).toList())
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public PhotoFile file(Long orderId, Long photoId) {
        requireOwner(orderId);
        ServiceOrderPhoto photo = photos.findById(photoId).orElseThrow(() -> notFound());
        boolean linked = diagnoses == null || evidence == null || diagnoses.findCurrent(orderId, java.util.Set.of(DiagnosisState.SUBMITTED)).stream()
                .findFirst().map(d -> evidence.existsByDiagnosisIdAndPhotoId(d.getId(), photoId)).orElse(false);
        if (!linked || !photo.getServiceOrder().getId().equals(orderId) || photo.getPhase() != ServiceOrderPhotoPhase.DIAGNOSIS) {
            throw notFound();
        }
        try {
            Path root = Path.of(storageDirectory).toAbsolutePath().normalize();
            Path resolved = root.resolve(photo.getStorageKey()).normalize();
            if (!resolved.startsWith(root)) throw notFound();
            Resource resource = new UrlResource(resolved.toUri());
            if (!resource.exists() || !resource.isReadable()) throw notFound();
            return new PhotoFile(resource, photo.getContentType());
        } catch (java.io.IOException e) { throw notFound(); }
    }

    private ServiceOrder requireOwner(Long orderId) {
        User actor = currentUser.require();
        ServiceOrder order = orders.findById(orderId).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Service order not found"));
        if (actor.getRole() != Role.CUSTOMER || order.getCustomer() == null || !order.getCustomer().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the owning customer can access diagnosis evidence");
        }
        return order;
    }

    private org.springframework.web.server.ResponseStatusException notFound() {
        return new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Diagnosis evidence not found");
    }

    public record PhotoFile(Resource resource, String contentType) { }
}
