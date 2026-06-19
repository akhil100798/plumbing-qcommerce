package com.pqc.core.entity;

public enum OutboxStatus {
    PENDING,
    IN_PROGRESS,
    PUBLISHED,
    DEAD_LETTER
}
