package com.pqc.core.exception;

import com.pqc.core.api.ApiError;
import com.pqc.core.service.IllegalOrderTransitionException;
import com.pqc.core.service.OrderConflictException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(apiError(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "You do not have permission to perform this operation.",
                request));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fieldError -> fieldError.getField(),
                        DefaultMessageSourceResolvable::getDefaultMessage,
                        (first, second) -> first));
        return ResponseEntity.badRequest().body(apiError(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "Request validation failed.",
                request,
                fieldErrors));
    }

    @ExceptionHandler(OrderConflictException.class)
    public ResponseEntity<ApiError> handleOrderConflict(
            OrderConflictException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError(
                HttpStatus.CONFLICT,
                ex.getCode(),
                ex.getMessage(),
                request));
    }

    @ExceptionHandler(IllegalOrderTransitionException.class)
    public ResponseEntity<ApiError> handleIllegalOrderTransition(
            IllegalOrderTransitionException ex,
            HttpServletRequest request) {
        HttpStatus status = "VALIDATION_FAILED".equals(ex.getCode())
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.CONFLICT;
        String field = "VALIDATION_FAILED".equals(ex.getCode()) ? "partsCharge" : "";
        Map<String, String> fields = field.isBlank() ? Map.of() : Map.of(field, ex.getMessage());
        return ResponseEntity.status(status).body(apiError(
                status,
                ex.getCode(),
                ex.getMessage(),
                request,
                fields));
    }

    private ApiError apiError(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request) {
        return apiError(status, code, message, request, Map.of());
    }

    private ApiError apiError(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors) {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        return new ApiError(
                LocalDateTime.now(),
                status.value(),
                code,
                message,
                request.getRequestURI(),
                correlationId,
                fieldErrors);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "status", 404,
            "error", "Not Found",
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateKey(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "status", 409,
            "error", "Conflict",
            "message", "A record with this value already exists. (Duplicate constraint violation)"
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "status", 400,
            "error", "Bad Request",
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "status", 500,
            "error", "Internal Server Error",
            "message", "An unexpected error occurred."
        ));
    }
}
