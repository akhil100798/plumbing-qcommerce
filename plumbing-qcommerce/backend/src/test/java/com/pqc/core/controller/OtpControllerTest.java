package com.pqc.core.controller;

import com.pqc.core.dto.OtpRequest;
import com.pqc.core.config.OtpProperties;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.OtpService;
import com.pqc.core.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OtpControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private OtpService otpService;
    @Mock private OtpProperties otpProperties;
    @Mock private Environment environment;
    @InjectMocks private OtpController controller;

    @Test
    void sendsOtpUsingTheCanonicalPhoneIdentifier() {
        OtpRequest request = new OtpRequest();
        request.setPhone("+91 9876543210");

        controller.sendOtp(request);

        verify(otpService).sendOtp("9876543210");
    }

    @Test
    void doesNotExposeQaCodeWhenDemoBypassIsDisabled() {
        OtpRequest request = new OtpRequest();
        request.setPhone("9876543210");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"local-staging", "staging"});
        when(otpProperties.isDemoBypassEnabled()).thenReturn(false);

        ResponseEntity<?> response = controller.sendOtp(request);

        assertThat(response.getBody()).isEqualTo(Map.of("message", "OTP sent successfully"));
    }

    @Test
    void exposesConfiguredQaCodeOnlyWhenExplicitlyEnabledOutsideProduction() {
        OtpRequest request = new OtpRequest();
        request.setPhone("9876543210");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"local-staging"});
        when(otpProperties.isDemoBypassEnabled()).thenReturn(true);
        when(otpProperties.getDemoCode()).thenReturn("654321");

        ResponseEntity<?> response = controller.sendOtp(request);

        assertThat(response.getBody()).isEqualTo(Map.of(
                "message", "OTP sent successfully",
                "qaCode", "654321"
        ));
    }

    @Test
    void neverExposesConfiguredQaCodeUnderProductionProfile() {
        OtpRequest request = new OtpRequest();
        request.setPhone("9876543210");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        ResponseEntity<?> response = controller.sendOtp(request);

        assertThat(response.getBody()).isEqualTo(Map.of("message", "OTP sent successfully"));
    }
}
