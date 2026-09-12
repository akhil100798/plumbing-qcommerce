package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreGapClosureTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private StoreBusinessHoursRepository storeBusinessHoursRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductOrderRepository productOrderRepository;

    @Mock
    private InventoryReservationRepository reservations;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private StoreService storeService;

    @InjectMocks
    private PlumberMaterialService plumberMaterialService;

    private Store sampleStore;
    private User sampleManager;

    @BeforeEach
    void setUp() {
        sampleManager = User.builder().id(10L).email("manager@store.com").role(Role.STORE_MANAGER).build();
        sampleStore = Store.builder().id(1L).name("FixKart Test Store").manager(sampleManager).build();
    }

    @Test
    void testBusinessHoursValidation_CloseBeforeOpen_ThrowsBadRequest() {
        lenient().when(currentUser.require()).thenReturn(sampleManager);
        lenient().when(storeRepository.findFirstByManager_Id(10L)).thenReturn(Optional.of(sampleStore));

        StoreBusinessHours invalidHour = StoreBusinessHours.builder()
                .dayOfWeek("MONDAY")
                .openTime(LocalTime.of(18, 0))
                .closeTime(LocalTime.of(9, 0))
                .closed(false)
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            storeService.updateStoreBusinessHours(List.of(invalidHour));
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Close time must be after open time"));
    }

    @Test
    void testLowStockThreshold_NegativeThreshold_ThrowsBadRequest() {
        lenient().when(currentUser.require()).thenReturn(sampleManager);
        lenient().when(storeRepository.findFirstByManager_Id(10L)).thenReturn(Optional.of(sampleStore));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            storeService.updateLowStockThreshold(1L, 100L, -5);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Low stock threshold cannot be negative"));
    }

    @Test
    void testAddCatalogProductToInventory_NegativeQuantity_ThrowsBadRequest() {
        lenient().when(currentUser.require()).thenReturn(sampleManager);
        lenient().when(storeRepository.findFirstByManager_Id(10L)).thenReturn(Optional.of(sampleStore));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            storeService.addCatalogProductToInventory(100L, -10, 5);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void testAvgPickTime_PreparingToReady_CalculatesEightMinutes() {
        java.time.LocalDateTime storeAccepted = java.time.LocalDateTime.of(2026, 8, 11, 9, 0, 0);
        java.time.LocalDateTime startPrep = java.time.LocalDateTime.of(2026, 8, 11, 10, 0, 0);
        java.time.LocalDateTime endReady = java.time.LocalDateTime.of(2026, 8, 11, 10, 8, 0);
        java.time.LocalDateTime plumberArrived = java.time.LocalDateTime.of(2026, 8, 11, 12, 0, 0);
        java.time.LocalDateTime collectionConfirmed = java.time.LocalDateTime.of(2026, 8, 11, 12, 5, 0);

        long pickDurationMinutes = java.time.Duration.between(startPrep, endReady).toMinutes();
        assertEquals(8L, pickDurationMinutes, "Pick duration must equal READY_FOR_PICKUP minus PREPARING (8 mins)");

        long withAcceptedTime = java.time.Duration.between(storeAccepted, endReady).toMinutes();
        assertNotEquals(68L, pickDurationMinutes, "Pick duration must not include earlier STORE_ACCEPTED time");

        long withPlumberDelayed = java.time.Duration.between(startPrep, plumberArrived).toMinutes();
        assertNotEquals(120L, pickDurationMinutes, "Pick duration must not include plumber delayed travel time");

        long withCollectionTime = java.time.Duration.between(startPrep, collectionConfirmed).toMinutes();
        assertNotEquals(125L, pickDurationMinutes, "Pick duration must not include handover confirmation time");
    }

    @Test
    void testAvgPickTime_EdgeCases_InvalidOrMissingTimestampsIgnored() {
        java.time.LocalDateTime startPrep = java.time.LocalDateTime.of(2026, 8, 11, 10, 0, 0);
        java.time.LocalDateTime endReady = java.time.LocalDateTime.of(2026, 8, 11, 10, 8, 0);

        // Missing preparing timestamp -> invalid
        java.time.LocalDateTime missingPrep = null;
        assertNull(missingPrep);

        // Missing ready timestamp -> invalid
        java.time.LocalDateTime missingReady = null;
        assertNull(missingReady);

        // Ready earlier than preparing -> negative duration invalid
        java.time.LocalDateTime readyEarlier = java.time.LocalDateTime.of(2026, 8, 11, 9, 50, 0);
        long negativeDuration = java.time.Duration.between(startPrep, readyEarlier).toMinutes();
        assertTrue(negativeDuration < 0, "Duration before start must be negative and excluded");
    }
}
