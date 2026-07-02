package com.pqc.core.service.otp;

public interface OtpStore {
    /**
     * Attempts to acquire resend cooldown for the given phoneKey.
     * Returns true if cooldown acquired (i.e. no cooldown was active), false if cooldown is active.
     */
    boolean acquireResendCooldown(String phoneKey, long cooldownSeconds);

    /**
     * Stores the computed OTP hash for a phoneKey.
     */
    void saveOtpHash(String phoneKey, String hash, long expirySeconds);

    /**
     * Retrieves the stored OTP hash for a phoneKey.
     */
    String getOtpHash(String phoneKey);

    /**
     * Increments and returns verification attempts for a phoneKey.
     */
    long incrementVerifyAttempts(String phoneKey, long expirySeconds);

    /**
     * Checks if the phoneKey is currently locked.
     */
    boolean checkLock(String phoneKey);

    /**
     * Locks the phoneKey for the given lockout duration in seconds.
     */
    void lockPhoneKey(String phoneKey, long lockoutSeconds);

    /**
     * Clears hash and attempts state for a phoneKey (typically consumed on success/lockout).
     */
    void deleteOtpState(String phoneKey);

    /**
     * Clears cooldown state for a phoneKey.
     */
    void deleteCooldownState(String phoneKey);
}
