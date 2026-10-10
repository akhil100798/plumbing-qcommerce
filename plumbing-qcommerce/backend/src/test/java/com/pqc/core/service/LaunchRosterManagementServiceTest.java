package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.LaunchPlumberRosterRepository;
import com.pqc.core.repository.LaunchPolicyRepository;
import com.pqc.core.repository.LaunchRosterAuditHistoryRepository;
import com.pqc.core.repository.PlumberKycRepository;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LaunchRosterManagementServiceTest {
    @Mock LaunchPolicyRepository policies;
    @Mock LaunchPlumberRosterRepository roster;
    @Mock LaunchRosterAuditHistoryRepository audit;
    @Mock UserRepository users;
    @Mock PlumberKycRepository kycs;
    @InjectMocks LaunchRosterManagementService service;

    private final LaunchPolicy policy = LaunchPolicy.builder().id(3L).policyKey(LaunchPolicyService.SERVICE_POLICY_KEY).active(false).build();

    @Test void activatesEligiblePlumberAndWritesAudit() {
        User plumber = plumber(UserStatus.ACTIVE);
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.of(kyc(PlumberKycStatus.APPROVED)));
        when(roster.findByPolicy_IdAndPlumberId(3L, 7L)).thenReturn(Optional.empty());

        var result = service.activate(3L, 7L, 11L, " Verified for launch ");

        assertThat(result.rosterApproved()).isTrue();
        verify(roster).saveAndFlush(argThat(member -> member.getPolicy() == policy && member.getPlumberId().equals(7L) && member.isApproved()));
        verify(audit).save(argThat(event -> event.getPolicyId().equals(3L) && event.getPlumberId().equals(7L)
                && event.getActorUserId().equals(11L) && event.getAction() == LaunchRosterAuditAction.ACTIVATED
                && event.getReason().equals("Verified for launch")));
    }

    @Test void activationIsIdempotentAndDoesNotWriteExtraAudit() {
        User plumber = plumber(UserStatus.ACTIVE);
        LaunchPlumberRoster member = membership(true);
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.of(kyc(PlumberKycStatus.APPROVED)));
        when(roster.findByPolicy_IdAndPlumberId(3L, 7L)).thenReturn(Optional.of(member));

        assertThat(service.activate(3L, 7L, 11L, "No state change").rosterApproved()).isTrue();

        verify(roster, never()).saveAndFlush(any());
        verifyNoInteractions(audit);
    }

    @Test void reactivatesAnExistingInactiveMembershipWithoutCreatingADuplicate() {
        User plumber = plumber(UserStatus.ACTIVE);
        LaunchPlumberRoster member = membership(false);
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.of(kyc(PlumberKycStatus.APPROVED)));
        when(roster.findByPolicy_IdAndPlumberId(3L, 7L)).thenReturn(Optional.of(member));

        assertThat(service.activate(3L, 7L, 11L, "Reapproved").rosterApproved()).isTrue();

        verify(roster).saveAndFlush(member);
        verify(audit).save(argThat(event -> event.getAction() == LaunchRosterAuditAction.ACTIVATED));
    }

    @Test void rejectsNonPlumberAndInactiveUser() {
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(User.builder().id(7L).role(Role.CUSTOMER).status(UserStatus.ACTIVE).build()));
        assertStatus(HttpStatus.CONFLICT, () -> service.activate(3L, 7L, 11L, "reason"));

        when(users.findById(8L)).thenReturn(Optional.of(plumber(UserStatus.SUSPENDED)));
        assertStatus(HttpStatus.CONFLICT, () -> service.activate(3L, 8L, 11L, "reason"));
        verifyNoInteractions(kycs, roster, audit);
    }

    @Test void rejectsMissingOrUnapprovedKyc() {
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber(UserStatus.ACTIVE)));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.empty());
        assertStatus(HttpStatus.CONFLICT, () -> service.activate(3L, 7L, 11L, "reason"));

        when(kycs.findByPlumberId(7L)).thenReturn(Optional.of(kyc(PlumberKycStatus.PENDING)));
        assertStatus(HttpStatus.CONFLICT, () -> service.activate(3L, 7L, 11L, "reason"));
        verifyNoInteractions(roster, audit);
    }

    @Test void requiresAnExistingServiceLaunchPolicy() {
        when(policies.findByIdForUpdate(99L)).thenReturn(Optional.empty());
        assertStatus(HttpStatus.NOT_FOUND, () -> service.activate(99L, 7L, 11L, "reason"));
        when(policies.findByIdForUpdate(4L)).thenReturn(Optional.of(LaunchPolicy.builder().id(4L).policyKey("OTHER").build()));
        assertStatus(HttpStatus.NOT_FOUND, () -> service.deactivate(4L, 7L, 11L, "reason"));
        verifyNoInteractions(users, kycs, roster, audit);
    }

    @Test void deactivatesExistingMembershipAndAuditsTransition() {
        User plumber = plumber(UserStatus.ACTIVE);
        LaunchPlumberRoster member = membership(true);
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.of(kyc(PlumberKycStatus.APPROVED)));
        when(roster.findByPolicy_IdAndPlumberId(3L, 7L)).thenReturn(Optional.of(member));

        assertThat(service.deactivate(3L, 7L, 11L, "No longer serving area").rosterApproved()).isFalse();
        verify(roster).saveAndFlush(argThat(row -> !row.isApproved()));
        verify(audit).save(argThat(event -> event.getAction() == LaunchRosterAuditAction.DEACTIVATED));
    }

    @Test void deactivationIsIdempotentAndCanRemoveInactivePlumber() {
        User plumber = plumber(UserStatus.SUSPENDED);
        LaunchPlumberRoster member = membership(false);
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.empty());
        when(roster.findByPolicy_IdAndPlumberId(3L, 7L)).thenReturn(Optional.of(member));

        assertThat(service.deactivate(3L, 7L, 11L, "Cleanup").rosterApproved()).isFalse();
        verify(roster, never()).saveAndFlush(any());
        verifyNoInteractions(audit);
    }

    @Test void deactivationWithoutAnExistingMembershipIsIdempotent() {
        when(policies.findByIdForUpdate(3L)).thenReturn(Optional.of(policy));
        when(users.findById(7L)).thenReturn(Optional.of(plumber(UserStatus.ACTIVE)));
        when(kycs.findByPlumberId(7L)).thenReturn(Optional.empty());
        when(roster.findByPolicy_IdAndPlumberId(3L, 7L)).thenReturn(Optional.empty());

        assertThat(service.deactivate(3L, 7L, 11L, "No-op removal").rosterApproved()).isFalse();
        verify(roster, never()).saveAndFlush(any());
        verifyNoInteractions(audit);
    }

    @Test void rejectsBlankOrOversizedAuditReason() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.activate(3L, 7L, 11L, "  "));
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.deactivate(3L, 7L, 11L, "x".repeat(1001)));
        verifyNoInteractions(policies, users, kycs, roster, audit);
    }

    private User plumber(UserStatus status) {
        return User.builder().id(7L).role(Role.PLUMBER).status(status).fullName("Test Plumber").email("plumber@test").phone("123").build();
    }

    private PlumberKyc kyc(PlumberKycStatus status) {
        return PlumberKyc.builder().plumberId(7L).status(status).availabilityStatus(PlumberAvailabilityStatus.OFFLINE).build();
    }

    private LaunchPlumberRoster membership(boolean approved) {
        return LaunchPlumberRoster.builder().id(2L).policy(policy).plumberId(7L).approved(approved).build();
    }

    private void assertStatus(HttpStatus expected, Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode()).isEqualTo(expected);
    }
}
