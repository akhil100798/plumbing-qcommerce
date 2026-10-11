package com.pqc.core.service;

import com.pqc.core.dto.CustomerDiagnosisEvidenceResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.ServiceOrderPhotoRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerDiagnosisEvidenceServiceTest {
    @Mock ServiceOrderRepository orders;
    @Mock ServiceOrderPhotoRepository photos;
    @Mock CurrentUser currentUser;
    @InjectMocks CustomerDiagnosisEvidenceService service;
    @TempDir Path tempDir;

    private User owner;
    private User other;
    private ServiceOrder order;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "storageDirectory", tempDir.toString());
        owner = User.builder().id(1L).role(Role.CUSTOMER).email("owner@test").build();
        other = User.builder().id(2L).role(Role.CUSTOMER).email("other@test").build();
        order = ServiceOrder.builder().id(10L).customer(owner).build();
        when(orders.findById(10L)).thenReturn(Optional.of(order));
    }

    @Test void owningCustomerListsOnlyDiagnosisMetadata() {
        when(currentUser.require()).thenReturn(owner);
        ServiceOrderPhoto diagnosis = photo(1L, ServiceOrderPhotoPhase.DIAGNOSIS);
        when(photos.findByServiceOrder_IdAndPhaseOrderByCreatedAtAsc(10L, ServiceOrderPhotoPhase.DIAGNOSIS)).thenReturn(List.of(diagnosis));
        List<CustomerDiagnosisEvidenceResponse> result = service.list(10L);
        assertThat(result).hasSize(1).allMatch(e -> e.phase().equals("DIAGNOSIS"));
        assertThat(result.get(0).binaryUrl()).contains("/customer/orders/10/diagnosis/evidence/1/file");
    }

    @Test void nonOwnerIsDenied() {
        when(currentUser.require()).thenReturn(other);
        assertThatThrownBy(() -> service.list(10L)).isInstanceOf(AccessDeniedException.class);
    }

    @Test void plumberCannotUseCustomerPath() {
        User plumber = User.builder().id(3L).role(Role.PLUMBER).email("plumber@test").build();
        when(currentUser.require()).thenReturn(plumber);
        assertThatThrownBy(() -> service.list(10L)).isInstanceOf(AccessDeniedException.class);
    }

    @Test void beforeAndAfterAreNotExposed() {
        when(currentUser.require()).thenReturn(owner);
        when(photos.findByServiceOrder_IdAndPhaseOrderByCreatedAtAsc(10L, ServiceOrderPhotoPhase.DIAGNOSIS)).thenReturn(List.of());
        assertThat(service.list(10L)).isEmpty();
    }

    @Test void binaryRequiresSameOrderAndDiagnosisPhase() throws Exception {
        when(currentUser.require()).thenReturn(owner);
        Path file = tempDir.resolve("diagnosis.jpg");
        Files.write(file, new byte[]{1, 2});
        ServiceOrderPhoto diagnosis = photo(1L, ServiceOrderPhotoPhase.DIAGNOSIS);
        diagnosis.setStorageKey("diagnosis.jpg");
        when(photos.findById(1L)).thenReturn(Optional.of(diagnosis));
        CustomerDiagnosisEvidenceService.PhotoFile result = service.file(10L, 1L);
        assertThat(result.resource().exists()).isTrue();
        assertThat(result.contentType()).isEqualTo("image/jpeg");

        ServiceOrderPhoto after = photo(2L, ServiceOrderPhotoPhase.AFTER);
        when(photos.findById(2L)).thenReturn(Optional.of(after));
        assertThatThrownBy(() -> service.file(10L, 2L)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Diagnosis evidence not found");
    }

    @Test void missingEvidenceIs404() {
        when(currentUser.require()).thenReturn(owner);
        when(photos.findById(anyLong())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.file(10L, 99L)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Diagnosis evidence not found");
    }

    @Test void storageKeyCannotEscapeThePhotoRoot() {
        when(currentUser.require()).thenReturn(owner);
        ServiceOrderPhoto diagnosis = photo(3L, ServiceOrderPhotoPhase.DIAGNOSIS);
        diagnosis.setStorageKey("../outside-secret.jpg");
        when(photos.findById(3L)).thenReturn(Optional.of(diagnosis));
        assertThatThrownBy(() -> service.file(10L, 3L)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Diagnosis evidence not found");
    }

    private ServiceOrderPhoto photo(Long id, ServiceOrderPhotoPhase phase) {
        return ServiceOrderPhoto.builder().id(id).serviceOrder(order).phase(phase)
                .storageKey("private.key").contentType("image/jpeg").sizeBytes(2).build();
    }
}
