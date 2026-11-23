package com.pqc.core.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
    }

    @Test
    void handleGeneral_withSensitiveMessage_sanitizesResponseAndHidesRawException() {
        when(request.getHeader("X-Correlation-ID")).thenReturn("corr-test-1234");
        Exception ex = new RuntimeException("SQL syntax error: table service_orders line 1 column 4 - secret DB details");

        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("status")).isEqualTo(500);
        assertThat(body.get("error")).isEqualTo("Internal Server Error");
        assertThat(body.get("message")).isEqualTo("Internal server error");
        assertThat(body.get("correlationId")).isEqualTo("corr-test-1234");

        // Assert sensitive exception string is NOT leaked
        assertThat(body.toString()).doesNotContain("SQL syntax error");
        assertThat(body.toString()).doesNotContain("secret DB details");
    }

    @Test
    void handleGeneral_withoutCorrelationHeader_generatesCorrelationId() {
        when(request.getHeader("X-Correlation-ID")).thenReturn(null);
        Exception ex = new NullPointerException("Null pointer in sensitive internal service");

        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("correlationId")).isNotNull();
        assertThat(body.get("message")).isEqualTo("Internal server error");
        assertThat(body.toString()).doesNotContain("Null pointer in sensitive internal service");
    }
}
