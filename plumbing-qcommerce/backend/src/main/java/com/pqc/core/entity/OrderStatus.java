package com.pqc.core.entity;

public enum OrderStatus {
    PENDING,        // Customer just submitted the request
    ACCEPTED,       // Store Manager or Plumber accepted the job
    IN_PROGRESS,    // Plumber is at the site working
    COMBINED_ORDER, // Active job with plumber-requested parts delivery in flight
    COMPLETED,      // Work done, invoice generated
    PAID,           // Payment successful
    CANCELLED       // Request cancelled by customer or system
}
