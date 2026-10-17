package com.pqc.core.service;

import com.pqc.core.dto.LaunchRosterPlumberResponse;
import com.pqc.core.dto.LaunchRosterPolicyResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.LaunchPlumberRosterRepository;
import com.pqc.core.repository.LaunchPolicyRepository;
import com.pqc.core.repository.LaunchRosterAuditHistoryRepository;
import com.pqc.core.repository.PlumberKycRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LaunchRosterManagementService {
    private final LaunchPolicyRepository policyRepository;
    private final LaunchPlumberRosterRepository rosterRepository;
    private final LaunchRosterAuditHistoryRepository auditRepository;
    private final UserRepository userRepository;
    private final PlumberKycRepository kycRepository;

    @Transactional(readOnly = true)
    public List<LaunchRosterPolicyResponse> serviceLaunchPolicies() {
        return policyRepository.findAllByPolicyKeyOrderByIdAsc(LaunchPolicyService.SERVICE_POLICY_KEY)
                .stream().map(this::toPolicyResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LaunchRosterPlumberResponse> roster(Long policyId) {
        LaunchPolicy policy = serviceLaunchPolicy(policyId);
        List<LaunchPlumberRoster> memberships = rosterRepository.findAllByPolicy_IdOrderByIdAsc(policy.getId());
        java.util.Map<Long, Boolean> approvedByPlumber = new java.util.HashMap<>();
        memberships.forEach(membership -> approvedByPlumber.put(membership.getPlumberId(), membership.isApproved()));

        java.util.Set<Long> memberIds = approvedByPlumber.keySet();
        java.util.Map<Long, User> plumbersById = new java.util.LinkedHashMap<>();
        userRepository.findByRoleOrderByIdAsc(Role.PLUMBER).forEach(user -> plumbersById.put(user.getId(), user));
        if (!memberIds.isEmpty()) {
            userRepository.findAllByIdInOrderByIdAsc(memberIds).forEach(user -> plumbersById.putIfAbsent(user.getId(), user));
        }
        java.util.Map<Long, PlumberKyc> kycByPlumberId = kycRepository.findByPlumberIdIn(plumbersById.keySet()).stream()
                .collect(java.util.stream.Collectors.toMap(PlumberKyc::getPlumberId, kyc -> kyc));
        return plumbersById.values().stream()
                .map(plumber -> {
                    PlumberKyc kyc = kycByPlumberId.get(plumber.getId());
                    return new LaunchRosterPlumberResponse(
                            plumber.getId(), plumber.getFullName(), plumber.getEmail(), plumber.getPhone(), plumber.getRole(), plumber.getStatus(),
                            kyc == null ? PlumberKycStatus.NOT_SUBMITTED : kyc.getStatus(),
                            kyc == null ? PlumberAvailabilityStatus.OFFLINE : kyc.getAvailabilityStatus(),
                            approvedByPlumber.getOrDefault(plumber.getId(), false));
                }).toList();
    }

    @Transactional
    public LaunchRosterPlumberResponse activate(Long policyId, Long plumberId, Long actorId, String reason) {
        String auditReason = requireReason(reason);
        LaunchPolicy policy = lockedServiceLaunchPolicy(policyId);
        User plumber = activePlumber(plumberId);
        PlumberKyc kyc = kycRepository.findByPlumberId(plumberId)
                .orElseThrow(() -> conflict("Plumber must have approved KYC before roster activation"));
        if (kyc.getStatus() != PlumberKycStatus.APPROVED) {
            throw conflict("Plumber must have approved KYC before roster activation");
        }

        LaunchPlumberRoster membership = rosterRepository.findByPolicy_IdAndPlumberId(policy.getId(), plumberId)
                .orElseGet(() -> LaunchPlumberRoster.builder().policy(policy).plumberId(plumberId).approved(false).build());
        if (!membership.isApproved()) {
            membership.setApproved(true);
            rosterRepository.saveAndFlush(membership);
            auditRepository.save(LaunchRosterAuditHistory.builder().policyId(policy.getId()).plumberId(plumberId)
                    .actorUserId(actorId).action(LaunchRosterAuditAction.ACTIVATED).reason(auditReason).build());
        }
        return toPlumberResponse(plumber, kyc, true);
    }

    @Transactional
    public LaunchRosterPlumberResponse deactivate(Long policyId, Long plumberId, Long actorId, String reason) {
        String auditReason = requireReason(reason);
        LaunchPolicy policy = lockedServiceLaunchPolicy(policyId);
        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plumber not found"));
        PlumberKyc kyc = kycRepository.findByPlumberId(plumberId).orElse(null);
        rosterRepository.findByPolicy_IdAndPlumberId(policy.getId(), plumberId).ifPresent(membership -> {
            if (membership.isApproved()) {
                membership.setApproved(false);
                rosterRepository.saveAndFlush(membership);
                auditRepository.save(LaunchRosterAuditHistory.builder().policyId(policy.getId()).plumberId(plumberId)
                        .actorUserId(actorId).action(LaunchRosterAuditAction.DEACTIVATED).reason(auditReason).build());
            }
        });
        return toPlumberResponse(plumber, kyc, false);
    }

    private LaunchPolicy lockedServiceLaunchPolicy(Long policyId) {
        LaunchPolicy policy = policyRepository.findByIdForUpdate(policyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Launch policy not found"));
        if (!LaunchPolicyService.SERVICE_POLICY_KEY.equals(policy.getPolicyKey())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Service launch policy not found");
        }
        return policy;
    }

    private LaunchPolicy serviceLaunchPolicy(Long policyId) {
        LaunchPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Launch policy not found"));
        if (!LaunchPolicyService.SERVICE_POLICY_KEY.equals(policy.getPolicyKey())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Service launch policy not found");
        }
        return policy;
    }

    private User activePlumber(Long plumberId) {
        User plumber = plumberAccount(plumberId);
        if (plumber.getStatus() != UserStatus.ACTIVE) {
            throw conflict("Roster membership requires an active plumber account");
        }
        return plumber;
    }

    private User plumberAccount(Long plumberId) {
        User plumber = userRepository.findById(plumberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plumber not found"));
        if (plumber.getRole() != Role.PLUMBER) {
            throw conflict("Roster membership requires a plumber account");
        }
        return plumber;
    }

    private String requireReason(String reason) {
        if (reason == null || reason.isBlank() || reason.trim().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reason of 1 to 1000 characters is required");
        }
        return reason.trim();
    }

    private LaunchRosterPlumberResponse toPlumberResponse(User plumber, PlumberKyc kyc, boolean approved) {
        return new LaunchRosterPlumberResponse(plumber.getId(), plumber.getFullName(), plumber.getEmail(), plumber.getPhone(), plumber.getRole(), plumber.getStatus(),
                kyc == null ? PlumberKycStatus.NOT_SUBMITTED : kyc.getStatus(),
                kyc == null ? PlumberAvailabilityStatus.OFFLINE : kyc.getAvailabilityStatus(), approved);
    }

    private LaunchRosterPolicyResponse toPolicyResponse(LaunchPolicy policy) {
        return new LaunchRosterPolicyResponse(policy.getId(), policy.getPolicyKey(), policy.isActive(), policy.isRosterEnforcementEnabled());
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
