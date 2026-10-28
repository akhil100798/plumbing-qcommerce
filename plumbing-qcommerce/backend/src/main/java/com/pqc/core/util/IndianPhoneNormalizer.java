package com.pqc.core.util;

import java.util.regex.Pattern;

/**
 * Converts supported Indian mobile-number input forms into the ten-digit
 * identifier used by the current User domain and OTP-store keys.
 */
public final class IndianPhoneNormalizer {

    private static final Pattern SUPPORTED_INPUT = Pattern.compile("^(?:\\d{10}|\\+91 ?\\d{10})$");

    private IndianPhoneNormalizer() {
    }

    public static boolean isSupported(String value) {
        return value != null && SUPPORTED_INPUT.matcher(value).matches();
    }

    public static String normalize(String value) {
        if (!isSupported(value)) {
            throw new IllegalArgumentException("Invalid Indian mobile number format");
        }
        return value.substring(value.length() - 10);
    }
}
