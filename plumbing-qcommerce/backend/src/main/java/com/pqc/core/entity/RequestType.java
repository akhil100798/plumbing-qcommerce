package com.pqc.core.entity;

public enum RequestType {
    NEARBY_AUTO,    // Workflow 1: Quick-assign nearest plumber
    STORE_ROUTED,   // Workflow 2: Customer selected a specific store
    DIRECT_PLUMBER  // Workflow 3: Customer selected a specific plumber
}
