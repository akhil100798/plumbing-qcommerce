package com.pqc.core.service;

import com.pqc.core.entity.ServicePricingCatalog;
import com.pqc.core.entity.ServicePricingCatalogLine;
import com.pqc.core.repository.ServicePricingCatalogLineRepository;
import com.pqc.core.repository.ServicePricingCatalogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.web.server.ResponseStatusException;

class QaLaborCatalogFixtureServiceTest {
    private final ServicePricingCatalogService catalogService = mock(ServicePricingCatalogService.class);
    private final ServicePricingCatalogLineService lineService = mock(ServicePricingCatalogLineService.class);
    private final ServicePricingCatalogRepository catalogs = mock(ServicePricingCatalogRepository.class);
    private final ServicePricingCatalogLineRepository lines = mock(ServicePricingCatalogLineRepository.class);
    private final QaLaborCatalogFixtureService fixtureService = new QaLaborCatalogFixtureService(
            catalogService, lineService, catalogs, lines);

    private final QaLaborCatalogFixtureService.Fixture fixture = new QaLaborCatalogFixtureService.Fixture(
            "qa-labor", "INR", "labor-standard", new BigDecimal("850.00"), "hour",
            new BigDecimal("1.00"), new BigDecimal("8.00"));

    @BeforeEach
    void normalizeKey() {
        when(catalogService.normalizeKey("qa-labor")).thenReturn("QA-LABOR");
    }

    @Test
    void exactActiveFixtureIsANoop() {
        ServicePricingCatalog active = ServicePricingCatalog.builder()
                .id(42L).catalogKey("QA-LABOR").currency("INR").version(1).status("ACTIVE")
                .effectiveFrom(LocalDateTime.now().minusDays(1)).build();
        when(catalogs.findByCatalogKeyOrderByVersionDesc("QA-LABOR")).thenReturn(List.of(active));
        when(lines.findByPricingCatalogId(42L)).thenReturn(List.of(line()));

        assertDoesNotThrow(() -> fixtureService.ensureFixture(fixture));

        verify(catalogService).lockFixtureKey("QA-LABOR", "INR");
        verify(catalogService, never()).activate(anyString(), anyString(), anyInt(), any(), any());
        verifyNoInteractions(lineService);
    }

    @Test
    void activeFixtureMismatchFailsWithoutMutation() {
        ServicePricingCatalog active = ServicePricingCatalog.builder()
                .id(42L).catalogKey("QA-LABOR").currency("INR").version(1).status("ACTIVE")
                .effectiveFrom(LocalDateTime.now().minusDays(1)).build();
        ServicePricingCatalogLine different = line();
        different.setAmount(new BigDecimal("851.00"));
        when(catalogs.findByCatalogKeyOrderByVersionDesc("QA-LABOR")).thenReturn(List.of(active));
        when(lines.findByPricingCatalogId(42L)).thenReturn(List.of(different));

        assertThrows(IllegalStateException.class, () -> fixtureService.ensureFixture(fixture));

        verify(catalogService, never()).activate(anyString(), anyString(), anyInt(), any(), any());
        verifyNoInteractions(lineService);
    }

    @Test
    void retiredCatalogCannotBeSilentlyRecreatedAsAnActiveFixture() {
        ServicePricingCatalog retired = ServicePricingCatalog.builder()
                .id(42L).catalogKey("QA-LABOR").currency("INR").version(1).status("RETIRED").build();
        when(catalogs.findByCatalogKeyOrderByVersionDesc("QA-LABOR")).thenReturn(List.of(retired));

        assertThrows(IllegalStateException.class, () -> fixtureService.ensureFixture(fixture));

        verify(catalogService, never()).activate(anyString(), anyString(), anyInt(), any(), any());
        verifyNoInteractions(lineService, lines);
    }

    @Test
    void missingFixtureCreatesCatalogAndLineThroughServices() {
        when(catalogs.findByCatalogKeyOrderByVersionDesc("QA-LABOR")).thenReturn(List.of());
        when(catalogService.activate(eq("QA-LABOR"), eq("INR"), eq(1), any(), isNull()))
                .thenReturn(ServicePricingCatalog.builder().id(73L).build());

        assertDoesNotThrow(() -> fixtureService.ensureFixture(fixture));

        verify(catalogService).activate(eq("QA-LABOR"), eq("INR"), eq(1), any(), isNull());
        verify(lineService).create(73L, "labor-standard", "LABOR", new BigDecimal("850.00"),
                "hour", new BigDecimal("1.00"), new BigDecimal("8.00"));
    }

    @Test
    void catalogKeyLockFailureStopsBeforeAnyCatalogMutation() {
        doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "invalid key"))
                .when(catalogService).lockFixtureKey("QA-LABOR", "INR");

        assertThrows(ResponseStatusException.class, () -> fixtureService.ensureFixture(fixture));

        verifyNoInteractions(catalogs, lines, lineService);
        verify(catalogService, never()).activate(anyString(), anyString(), anyInt(), any(), any());
    }

    @Test
    void rejectsInvalidFixtureBeforeDatabaseOrMutationCalls() {
        var invalid = new QaLaborCatalogFixtureService.Fixture("qa-labor", "INR", "labor-standard",
                new BigDecimal("850.001"), "hour", new BigDecimal("1.00"), new BigDecimal("8.00"));

        assertThrows(IllegalArgumentException.class, () -> fixtureService.ensureFixture(invalid));

        verifyNoInteractions(catalogs, lines, lineService);
        verify(catalogService, never()).lockFixtureKey(anyString(), anyString());
    }

    @Test
    void rejectsQuantityPrecisionBeforeDatabaseOrMutationCalls() {
        var invalid = new QaLaborCatalogFixtureService.Fixture("qa-labor", "INR", "labor-standard",
                new BigDecimal("850.00"), "hour", new BigDecimal("1.001"), new BigDecimal("8.00"));

        assertThrows(IllegalArgumentException.class, () -> fixtureService.ensureFixture(invalid));

        verifyNoInteractions(catalogs, lines, lineService);
        verify(catalogService, never()).lockFixtureKey(anyString(), anyString());
    }

    private ServicePricingCatalogLine line() {
        return ServicePricingCatalogLine.builder().pricingCatalogId(42L).lineKey("labor-standard")
                .lineType("LABOR").amount(new BigDecimal("850.00")).unit("hour")
                .minQuantity(new BigDecimal("1.00")).maxQuantity(new BigDecimal("8.00")).build();
    }
}
