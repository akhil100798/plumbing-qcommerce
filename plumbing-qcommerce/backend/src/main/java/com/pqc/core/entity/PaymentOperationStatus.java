package com.pqc.core.entity;

public enum PaymentOperationStatus {
    INITIATED,
    CAPTURE_IN_PROGRESS,
    CAPTURED,
    FAILED,
    REQUIRES_RECONCILIATION
}
