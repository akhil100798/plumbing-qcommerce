package com.pqc.core.service;

import com.pqc.core.entity.LaunchPolicy;
import com.pqc.core.repository.LaunchPolicyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class LaunchPolicyServiceTest {
    private final LaunchPolicyRepository repository = mock(LaunchPolicyRepository.class);
    private final LaunchPolicyService service = new LaunchPolicyService(repository);

    @Test
    void noActivePolicyPreservesLegacyMode() {
        when(repository.findAllByPolicyKeyAndActiveTrue(LaunchPolicyService.SERVICE_POLICY_KEY)).thenReturn(List.of());

        assertThat(service.activePolicy()).isNull();
        assertThat(service.launchRosterEnforced()).isFalse();
        assertThat(service.isWithinServiceArea(19.07, 72.87)).isTrue();
        assertThat(service.isWithinServiceArea(null, null)).isTrue();
    }

    @Test
    void enabledMaterialEnforcementWithoutStoreFailsClosed() {
        LaunchPolicy policy = LaunchPolicy.builder().active(true).serviceMaterialEnforcementEnabled(true).build();
        when(repository.findAllByPolicyKeyAndActiveTrue(LaunchPolicyService.SERVICE_POLICY_KEY)).thenReturn(List.of(policy));

        assertThatThrownBy(service::requiredOwnedStoreId).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void activePolicyRejectsAmbiguousConfiguration() {
        when(repository.findAllByPolicyKeyAndActiveTrue(LaunchPolicyService.SERVICE_POLICY_KEY))
                .thenReturn(List.of(LaunchPolicy.builder().id(1L).active(true).build(),
                        LaunchPolicy.builder().id(2L).active(true).build()));

        assertThatThrownBy(service::activePolicy).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void serviceAreaIncludesBoundaryAndRejectsOutside() {
        LaunchPolicy policy = LaunchPolicy.builder().active(true)
                .serviceAreaCenterLatitude(0.0).serviceAreaCenterLongitude(0.0)
                .serviceAreaRadiusKm(new BigDecimal("1.000")).build();
        when(repository.findAllByPolicyKeyAndActiveTrue(LaunchPolicyService.SERVICE_POLICY_KEY)).thenReturn(List.of(policy));

        assertThat(service.isWithinServiceArea(0.0, 0.0)).isTrue();
        assertThat(service.isWithinServiceArea(0.0, 0.008983)).isTrue();
        assertThat(service.isWithinServiceArea(0.0, 0.02)).isFalse();
        assertThat(service.isWithinServiceArea(null, 0.0)).isFalse();
    }

    @Test
    void unsupportedConfiguredCurrencyFailsClosed() {
        LaunchPolicy policy = LaunchPolicy.builder().active(true).currency("USD").build();
        when(repository.findAllByPolicyKeyAndActiveTrue(LaunchPolicyService.SERVICE_POLICY_KEY)).thenReturn(List.of(policy));

        assertThatThrownBy(service::authoritativeCurrency)
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("unsupported");
    }
}
