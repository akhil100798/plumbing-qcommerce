package com.pqc.core.service;

public class IllegalOrderTransitionException extends RuntimeException {
    private final String code;

    public IllegalOrderTransitionException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
