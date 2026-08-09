package com.pqc.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Production-grade Rate Limiting Filter for sensitive Authentication Endpoints.
 * Enforces per-IP request throttling to prevent brute-force login and OTP spam attacks.
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 20;
    private static final long TIME_WINDOW_MS = 60_000L;

    private final Map<String, ClientRateLimitState> rateLimitMap = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Only filter sensitive authentication POST mutation endpoints
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return !(path.endsWith("/auth/login") || path.endsWith("/auth/customer/register") ||
                 path.endsWith("/auth/plumber/register") || path.endsWith("/auth/store/register") ||
                 path.contains("/send-otp"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = getClientIp(request);
        long now = System.currentTimeMillis();

        ClientRateLimitState state = rateLimitMap.compute(clientIp, (ip, currentState) -> {
            if (currentState == null || (now - currentState.startTime) > TIME_WINDOW_MS) {
                return new ClientRateLimitState(now, 1);
            }
            currentState.requestCount++;
            return currentState;
        });

        if (state.requestCount > MAX_REQUESTS_PER_MINUTE) {
            log.warn("Rate limit exceeded for client IP [{}] on path [{}] - requests: {}",
                    clientIp, request.getRequestURI(), state.requestCount);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            response.getWriter().write(String.format(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded for endpoint. Please wait 60 seconds.\",\"path\":\"%s\"}",
                    request.getRequestURI()
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private static class ClientRateLimitState {
        final long startTime;
        int requestCount;

        ClientRateLimitState(long startTime, int requestCount) {
            this.startTime = startTime;
            this.requestCount = requestCount;
        }
    }
}
