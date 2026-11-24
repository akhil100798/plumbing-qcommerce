package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.LaunchPlumberRosterRepository;
import com.pqc.core.repository.PlumberKycRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlumberEligibilityService {
    private final PlumberKycRepository plumberKycRepository;
    private final LaunchPolicyService launchPolicyService;
    private final LaunchPlumberRosterRepository rosterRepository;

    public boolean isApprovedAndOnline(User plumber) {
        return plumber != null
                && plumber.getRole() == Role.PLUMBER
                && plumberKycRepository.findByPlumberId(plumber.getId())
                .map(kyc -> kyc.getStatus() == PlumberKycStatus.APPROVED
                        && kyc.getAvailabilityStatus() == PlumberAvailabilityStatus.ONLINE)
                .orElse(false);
    }

    public boolean isEligibleForLaunch(User plumber) {
        if (!isApprovedAndOnline(plumber)) return false;
        if (!launchPolicyService.launchRosterEnforced()) return true;
        LaunchPolicy policy = launchPolicyService.activePolicy();
        return policy != null
                && rosterRepository.existsByPolicyIdAndPlumberIdAndApprovedTrue(policy.getId(), plumber.getId());
    }

    public void requireApproved(User plumber) {
        if (plumber == null || plumber.getRole() != Role.PLUMBER
                || !plumberKycRepository.findByPlumberId(plumber.getId())
                .map(kyc -> kyc.getStatus() == PlumberKycStatus.APPROVED)
                .orElse(false)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Plumber must have approved KYC before becoming online");
        }
    }

    public void requireOnlineEligibility(User plumber) {
        requireApproved(plumber);
        if (launchPolicyService.launchRosterEnforced() && !isRosterApproved(plumber)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Plumber is not approved for the active launch roster");
        }
    }

    public boolean isRosterApproved(User plumber) {
        LaunchPolicy policy = launchPolicyService.activePolicy();
        return policy != null
                && rosterRepository.existsByPolicyIdAndPlumberIdAndApprovedTrue(policy.getId(), plumber.getId());
    }
}
