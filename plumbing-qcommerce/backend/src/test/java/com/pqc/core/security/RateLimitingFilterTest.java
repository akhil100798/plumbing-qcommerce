package com.pqc.core.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingFilterTest {

    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter();
    }

    @Test
    @DisplayName("Should allow authentication requests under rate limit threshold")
    void shouldAllowRequestsUnderThreshold() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("192.168.1.100");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        rateLimitingFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(429);
        assertThat(filterChain.getRequest()).isNotNull();
    }

    @Test
    @DisplayName("Should return HTTP 429 Too Many Requests when rate limit threshold is exceeded")
    void shouldReturn429WhenThresholdExceeded() throws Exception {
        String clientIp = "192.168.1.200";

        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain filterChain = new MockFilterChain();
            rateLimitingFilter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isNotEqualTo(429);
        }

        // 21st request exceeds threshold
        MockHttpServletRequest rateLimitedRequest = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        rateLimitedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse rateLimitedResponse = new MockHttpServletResponse();
        MockFilterChain rateLimitedFilterChain = new MockFilterChain();

        rateLimitingFilter.doFilterInternal(rateLimitedRequest, rateLimitedResponse, rateLimitedFilterChain);

        assertThat(rateLimitedResponse.getStatus()).isEqualTo(429);
        assertThat(rateLimitedResponse.getHeader("Retry-After")).isEqualTo("60");
        assertThat(rateLimitedResponse.getContentAsString()).contains("Rate limit exceeded");
    }
}
