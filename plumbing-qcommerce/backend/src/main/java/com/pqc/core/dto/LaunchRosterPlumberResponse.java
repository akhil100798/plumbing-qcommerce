package com.pqc.core.dto;

import com.pqc.core.entity.PlumberAvailabilityStatus;
import com.pqc.core.entity.PlumberKycStatus;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.entity.Role;

public record LaunchRosterPlumberResponse(
        Long plumberId,
        String fullName,
        String email,
        String phone,
        Role role,
        UserStatus userStatus,
        PlumberKycStatus kycStatus,
        PlumberAvailabilityStatus availabilityStatus,
        boolean rosterApproved
) {
}
