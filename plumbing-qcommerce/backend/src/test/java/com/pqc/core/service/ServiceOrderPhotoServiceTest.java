package com.pqc.core.service;

import com.pqc.core.dto.ServiceOrderPhotoResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceOrderPhotoServiceTest {

    @Mock private ServiceOrderRepository orders;
    @Mock private ServiceOrderPhotoRepository photos;
    @Mock private CurrentUser currentUser;

    @InjectMocks private ServiceOrderPhotoService service;

    @TempDir Path tempDir;

    private User plumber;
    private User otherPlumber;
    private ServiceOrder order;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "storageDirectory", tempDir.toString());

        plumber = User.builder().id(10L).fullName("Assigned Plumber").build();
        otherPlumber = User.builder().id(20L).fullName("Other Plumber").build();
        order = ServiceOrder.builder().id(100L).plumber(plumber).status(OrderStatus.IN_PROGRESS).build();
    }

    @Test
    void uploadSucceedsForValidAfterPhotoOnActiveJob() {
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));
        when(photos.save(any(ServiceOrderPhoto.class))).thenAnswer(inv -> {
            ServiceOrderPhoto p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{1, 2, 3});
        ServiceOrderPhotoResponse response = service.upload(100L, ServiceOrderPhotoPhase.AFTER, file);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.contentType()).isEqualTo("image/jpeg");
        verify(photos).save(any(ServiceOrderPhoto.class));
    }

    @Test
    void uploadSucceedsForAfterPhotoOnResumedJob() {
        order.setStatus(OrderStatus.WORK_RESUMED);
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));
        when(photos.save(any(ServiceOrderPhoto.class))).thenAnswer(inv -> {
            ServiceOrderPhoto p = inv.getArgument(0);
            p.setId(2L);
            return p;
        });

        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{4, 5, 6});
        ServiceOrderPhotoResponse response = service.upload(100L, ServiceOrderPhotoPhase.AFTER, file);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(2L);
    }

    @Test
    void uploadRejectsNullOrEmptyFile() {
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> service.upload(100L, ServiceOrderPhotoPhase.AFTER, emptyFile))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    void uploadRejectsOversizedFile() {
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        byte[] largeBytes = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile largeFile = new MockMultipartFile("file", "large.jpg", "image/jpeg", largeBytes);
        assertThatThrownBy(() -> service.upload(100L, ServiceOrderPhotoPhase.AFTER, largeFile))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    void uploadRejectsUnsupportedMimeType() {
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        MockMultipartFile pdfFile = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1, 2});
        assertThatThrownBy(() -> service.upload(100L, ServiceOrderPhotoPhase.AFTER, pdfFile))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    void uploadRejectsBeforePhotoWhenOrderNotActive() {
        order.setStatus(OrderStatus.ACCEPTED);
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{1, 2});
        assertThatThrownBy(() -> service.upload(100L, ServiceOrderPhotoPhase.BEFORE, file))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    void uploadRejectsAfterPhotoWhenOrderNotActiveOrResumed() {
        order.setStatus(OrderStatus.ACCEPTED);
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{1, 2});
        assertThatThrownBy(() -> service.upload(100L, ServiceOrderPhotoPhase.AFTER, file))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    void rejectsAccessWhenUserIsNotAssignedPlumber() {
        when(currentUser.require()).thenReturn(otherPlumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{1, 2});
        assertThatThrownBy(() -> service.upload(100L, ServiceOrderPhotoPhase.AFTER, file))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only the assigned plumber");
    }

    @Test
    void listReturnsPhotosForAssignedPlumber() {
        when(currentUser.require()).thenReturn(plumber);
        when(orders.findById(100L)).thenReturn(Optional.of(order));

        ServiceOrderPhoto p1 = ServiceOrderPhoto.builder().id(1L).serviceOrder(order).phase(ServiceOrderPhotoPhase.AFTER)
                .storageKey("key1.jpg").contentType("image/jpeg").sizeBytes(100L).build();
        when(photos.findByServiceOrder_IdAndPhaseOrderByCreatedAtAsc(100L, ServiceOrderPhotoPhase.AFTER))
                .thenReturn(List.of(p1));

        List<ServiceOrderPhotoResponse> list = service.list(100L, ServiceOrderPhotoPhase.AFTER);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).id()).isEqualTo(1L);
    }
}
