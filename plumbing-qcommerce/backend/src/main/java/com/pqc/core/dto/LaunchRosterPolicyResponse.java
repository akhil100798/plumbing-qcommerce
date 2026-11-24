package com.pqc.core.dto;

public record LaunchRosterPolicyResponse(
        Long policyId,
        String policyKey,
        boolean active,
        boolean rosterEnforcementEnabled
) {
}
