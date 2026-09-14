package com.pqc.core.controller;

import com.pqc.core.dto.OtpRequest;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.OtpService;
import com.pqc.core.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OtpControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private OtpService otpService;
    @InjectMocks private OtpController controller;

    @Test
    void sendsOtpUsingTheCanonicalPhoneIdentifier() {
        OtpRequest request = new OtpRequest();
        request.setPhone("+91 9876543210");

        controller.sendOtp(request);

        verify(otpService).sendOtp("9876543210");
    }
}
