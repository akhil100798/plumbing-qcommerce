package com.pqc.core.service;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlumberManagerServiceTest {
    @Mock UserRepository users;
    @Mock PlumberKycRepository kycs;
    @Mock ServiceOrderRepository jobs;
    @Mock SettlementRepository settlements;
    @InjectMocks PlumberManagerService service;

    @Test void approvesPendingKyc() { PlumberKyc kyc = pending(); when(kycs.findById(1L)).thenReturn(Optional.of(kyc)); when(kycs.save(kyc)).thenReturn(kyc); assertThat(service.approveKyc(1L, 8L, new PlumberKycActionRequest("verified", null)).status()).isEqualTo(PlumberKycStatus.APPROVED); assertThat(kyc.getReviewedByAdminId()).isEqualTo(8L); }
    @Test void rejectsPendingKyc() { PlumberKyc kyc = pending(); when(kycs.findById(1L)).thenReturn(Optional.of(kyc)); when(kycs.save(kyc)).thenReturn(kyc); assertThat(service.rejectKyc(1L, 8L, new PlumberKycActionRequest(null, "unclear PAN")).status()).isEqualTo(PlumberKycStatus.REJECTED); }
    @Test void cannotApproveReviewedKyc() { PlumberKyc kyc = pending(); kyc.setStatus(PlumberKycStatus.APPROVED); when(kycs.findById(1L)).thenReturn(Optional.of(kyc)); assertThatThrownBy(() -> service.approveKyc(1L, 8L, new PlumberKycActionRequest("ok", null))).isInstanceOf(ResponseStatusException.class).hasMessageContaining("409"); }
    @Test void rejectionNeedsReason() { when(kycs.findById(1L)).thenReturn(Optional.of(pending())); assertThatThrownBy(() -> service.rejectKyc(1L, 8L, new PlumberKycActionRequest(null, " "))).isInstanceOf(ResponseStatusException.class).hasMessageContaining("400"); }
    @Test void availabilityOnlyUpdatesPlumbers() { User customer = User.builder().id(2L).role(Role.CUSTOMER).build(); when(users.findById(2L)).thenReturn(Optional.of(customer)); assertThatThrownBy(() -> service.updateAvailability(2L, new PlumberAvailabilityUpdateRequest(PlumberAvailabilityStatus.OFFLINE, "test"))).isInstanceOf(ResponseStatusException.class).hasMessageContaining("400"); }

    private PlumberKyc pending() { return PlumberKyc.builder().id(1L).plumberId(2L).status(PlumberKycStatus.PENDING).availabilityStatus(PlumberAvailabilityStatus.OFFLINE).build(); }
}
