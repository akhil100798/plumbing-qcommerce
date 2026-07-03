package com.pqc.core.service.notification;

public interface SmsSender {
    /**
     * Sends the OTP text message to the target phone number.
     * Note: Implementing classes must never log the OTP value in plaintext.
     */
    void sendOtp(String phoneNumber, String otp);
}
