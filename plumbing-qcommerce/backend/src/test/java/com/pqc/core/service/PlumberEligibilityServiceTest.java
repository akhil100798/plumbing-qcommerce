package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.LaunchPlumberRosterRepository;
import com.pqc.core.repository.PlumberKycRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PlumberEligibilityServiceTest {
    private final PlumberKycRepository kycRepository = mock(PlumberKycRepository.class);
    private final LaunchPolicyService policyService = mock(LaunchPolicyService.class);
    private final LaunchPlumberRosterRepository rosterRepository = mock(LaunchPlumberRosterRepository.class);
    private final PlumberEligibilityService service = new PlumberEligibilityService(kycRepository, policyService, rosterRepository);

    @Test
    void unapprovedPlumberIsNotEligibleAndCannotBeOnline() {
        User plumber = User.builder().id(7L).role(Role.PLUMBER).build();
        when(kycRepository.findByPlumberId(7L)).thenReturn(Optional.of(PlumberKyc.builder()
                .plumberId(7L).status(PlumberKycStatus.PENDING).availabilityStatus(PlumberAvailabilityStatus.ONLINE).build()));

        assertThat(service.isApprovedAndOnline(plumber)).isFalse();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.requireApproved(plumber))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

    @Test
    void activeLaunchRosterRejectsApprovedPlumberNotOnRoster() {
        User plumber = User.builder().id(8L).role(Role.PLUMBER).build();
        LaunchPolicy policy = LaunchPolicy.builder().id(3L).active(true).rosterEnforcementEnabled(true).build();
        when(kycRepository.findByPlumberId(8L)).thenReturn(Optional.of(PlumberKyc.builder()
                .plumberId(8L).status(PlumberKycStatus.APPROVED).availabilityStatus(PlumberAvailabilityStatus.ONLINE).build()));
        when(policyService.launchRosterEnforced()).thenReturn(true);
        when(policyService.activePolicy()).thenReturn(policy);
        when(rosterRepository.existsByPolicyIdAndPlumberIdAndApprovedTrue(3L, 8L)).thenReturn(false);

        assertThat(service.isEligibleForLaunch(plumber)).isFalse();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.requireOnlineEligibility(plumber))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

    @Test
    void activeLaunchRosterAllowsApprovedRosterPlumber() {
        User plumber = User.builder().id(9L).role(Role.PLUMBER).build();
        LaunchPolicy policy = LaunchPolicy.builder().id(4L).active(true).rosterEnforcementEnabled(true).build();
        when(kycRepository.findByPlumberId(9L)).thenReturn(Optional.of(PlumberKyc.builder()
                .plumberId(9L).status(PlumberKycStatus.APPROVED).availabilityStatus(PlumberAvailabilityStatus.ONLINE).build()));
        when(policyService.launchRosterEnforced()).thenReturn(true);
        when(policyService.activePolicy()).thenReturn(policy);
        when(rosterRepository.existsByPolicyIdAndPlumberIdAndApprovedTrue(4L, 9L)).thenReturn(true);

        assertThat(service.isEligibleForLaunch(plumber)).isTrue();
    }
}
