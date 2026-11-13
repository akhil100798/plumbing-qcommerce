package com.pqc.core.service.notification;

import com.pqc.core.util.PhoneMaskingUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Production-ready Twilio SMS & OTP Sender Adapter.
 *
 * Features:
 * - Direct HTTP-based Twilio API integration without third-party SDK dependencies.
 * - Integrated circuit breaker: after 5 consecutive failures, enters cooldown for 60 seconds.
 * - Safe mock/sandbox simulation mode when live credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are absent.
 * - Strict zero-plaintext OTP logging; all phone numbers masked in logs.
 */
@Component
@ConditionalOnProperty(prefix = "app.sms", name = "provider", havingValue = "twilio")
@Slf4j
public class TwilioSmsSender implements SmsSender {

    private static final int MAX_CONSECUTIVE_FAILURES = 5;
    private static final long CIRCUIT_COOLDOWN_MS = 60_000L; // 60 seconds

    @Value("${app.sms.twilio.account-sid:${TWILIO_ACCOUNT_SID:}}")
    private String accountSid;

    @Value("${app.sms.twilio.auth-token:${TWILIO_AUTH_TOKEN:}}")
    private String authToken;

    @Value("${app.sms.twilio.from-number:${TWILIO_FROM_NUMBER:}}")
    private String fromNumber;

    private final HttpClient httpClient;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicLong circuitTripTimestamp = new AtomicLong(0L);

    public TwilioSmsSender() {
        this(null, null, null, null);
    }

    public TwilioSmsSender(HttpClient httpClient, String accountSid, String authToken, String fromNumber) {
        this.httpClient = (httpClient != null) ? httpClient : HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
    }

    public boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank()
                && !accountSid.toLowerCase().contains("dummy")
                && authToken != null && !authToken.isBlank()
                && fromNumber != null && !fromNumber.isBlank();
    }

    public boolean isCircuitOpen() {
        long tripTime = circuitTripTimestamp.get();
        if (tripTime == 0L) {
            return false;
        }
        if (System.currentTimeMillis() - tripTime > CIRCUIT_COOLDOWN_MS) {
            // Half-open / reset cooldown
            circuitTripTimestamp.set(0L);
            consecutiveFailures.set(0);
            log.info("[SMS-TWILIO] Circuit breaker half-open: resuming delivery attempts.");
            return false;
        }
        return true;
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        String maskedPhone = PhoneMaskingUtil.mask(phoneNumber);

        if (!isConfigured()) {
            log.info("[SMS-TWILIO] Live Twilio credentials not configured. Code transmission simulated for {}.", maskedPhone);
            return;
        }

        if (isCircuitOpen()) {
            log.warn("[SMS-TWILIO] Circuit breaker is OPEN. Skipping delivery attempt for {} to prevent carrier thrashing.", maskedPhone);
            return;
        }

        try {
            String formBody = "To=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8)
                    + "&From=" + URLEncoder.encode(fromNumber, StandardCharsets.UTF_8)
                    + "&Body=" + URLEncoder.encode("Your FixKart verification code is: " + otp + ". Valid for 5 minutes.", StandardCharsets.UTF_8);

            String authHeader = "Basic " + Base64.getEncoder().encodeToString(
                    (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

            URI uri = URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                consecutiveFailures.set(0);
                log.info("[SMS-TWILIO] Verification code successfully dispatched via Twilio to {}.", maskedPhone);
            } else {
                int failures = consecutiveFailures.incrementAndGet();
                log.error("[SMS-TWILIO] Twilio delivery failed for {} (Status: {}). Consecutive failures: {}",
                        maskedPhone, response.statusCode(), failures);

                if (failures >= MAX_CONSECUTIVE_FAILURES) {
                    circuitTripTimestamp.set(System.currentTimeMillis());
                    log.error("[SMS-TWILIO] Circuit breaker TRIPPED OPEN. Twilio requests paused for 60 seconds.");
                }
            }
        } catch (Exception e) {
            int failures = consecutiveFailures.incrementAndGet();
            log.error("[SMS-TWILIO] Exception during Twilio dispatch for {}: {}. Consecutive failures: {}",
                    maskedPhone, e.getMessage(), failures);

            if (failures >= MAX_CONSECUTIVE_FAILURES) {
                circuitTripTimestamp.set(System.currentTimeMillis());
                log.error("[SMS-TWILIO] Circuit breaker TRIPPED OPEN due to network errors.");
            }
        }
    }

    public int getConsecutiveFailures() {
        return consecutiveFailures.get();
    }

    public void resetCircuitBreaker() {
        consecutiveFailures.set(0);
        circuitTripTimestamp.set(0L);
    }

    public void tripCircuitBreakerForTesting() {
        consecutiveFailures.set(MAX_CONSECUTIVE_FAILURES);
        circuitTripTimestamp.set(System.currentTimeMillis());
    }
}
