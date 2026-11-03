package com.pqc.core.service.notification;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TwilioSmsSenderTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    @Test
    void isConfigured_returnsFalseWhenCredentialsMissingOrDummy() {
        TwilioSmsSender emptySender = new TwilioSmsSender(null, "", "", "");
        assertThat(emptySender.isConfigured()).isFalse();

        TwilioSmsSender dummySender = new TwilioSmsSender(null, "dummy_sid", "auth_token_123", "+1234567890");
        assertThat(dummySender.isConfigured()).isFalse();

        TwilioSmsSender missingFrom = new TwilioSmsSender(null, "AC1234567890abcdef", "auth_token_123", "");
        assertThat(missingFrom.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_returnsTrueWhenValidCredentialsSet() {
        TwilioSmsSender configuredSender = new TwilioSmsSender(
                null, "AC1234567890abcdef", "valid_auth_token_9876", "+15551234567"
        );
        assertThat(configuredSender.isConfigured()).isTrue();
    }

    @Test
    void sendOtp_inSafeSimulationMode_doesNotCallHttpClient() throws Exception {
        TwilioSmsSender simulationSender = new TwilioSmsSender(httpClient, "", "", "");

        simulationSender.sendOtp("+919876543210", "123456");

        verifyNoInteractions(httpClient);
    }

    @Test
    void sendOtp_whenConfigured_sendsHttpRequestSuccessfully() throws Exception {
        TwilioSmsSender sender = new TwilioSmsSender(
                httpClient, "AC1234567890abcdef", "auth_secret_token", "+15551234567"
        );

        when(httpResponse.statusCode()).thenReturn(201);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        sender.sendOtp("+919876543210", "654321");

        verify(httpClient, times(1)).send(any(HttpRequest.class), any());
        assertThat(sender.getConsecutiveFailures()).isEqualTo(0);
        assertThat(sender.isCircuitOpen()).isFalse();
    }

    @Test
    void circuitBreaker_after5ConsecutiveFailures_tripsOpenAndSkipsSubsequentCalls() throws Exception {
        TwilioSmsSender sender = new TwilioSmsSender(
                httpClient, "AC1234567890abcdef", "auth_secret_token", "+15551234567"
        );

        when(httpResponse.statusCode()).thenReturn(500);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        // Fail 5 times consecutively
        for (int i = 0; i < 5; i++) {
            sender.sendOtp("+919876543210", "112233");
        }

        assertThat(sender.getConsecutiveFailures()).isEqualTo(5);
        assertThat(sender.isCircuitOpen()).isTrue();

        // 6th call should be skipped without calling httpClient
        sender.sendOtp("+919876543210", "112233");
        verify(httpClient, times(5)).send(any(HttpRequest.class), any());
    }

    @Test
    void circuitBreaker_handlesExceptionsAndTripsOpen() throws Exception {
        TwilioSmsSender sender = new TwilioSmsSender(
                httpClient, "AC1234567890abcdef", "auth_secret_token", "+15551234567"
        );

        when(httpClient.send(any(HttpRequest.class), any())).thenThrow(new IOException("Network timeout"));

        for (int i = 0; i < 5; i++) {
            sender.sendOtp("+919876543210", "445566");
        }

        assertThat(sender.isCircuitOpen()).isTrue();
    }

    @Test
    void circuitBreaker_resetsAfterManualResetOrCooldown() {
        TwilioSmsSender sender = new TwilioSmsSender(
                httpClient, "AC1234567890abcdef", "auth_secret_token", "+15551234567"
        );

        sender.tripCircuitBreakerForTesting();
        assertThat(sender.isCircuitOpen()).isTrue();

        sender.resetCircuitBreaker();
        assertThat(sender.isCircuitOpen()).isFalse();
        assertThat(sender.getConsecutiveFailures()).isEqualTo(0);
    }
}
