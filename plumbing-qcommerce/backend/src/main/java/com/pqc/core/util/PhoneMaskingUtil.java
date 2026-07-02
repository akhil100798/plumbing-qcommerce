package com.pqc.core.util;

public class PhoneMaskingUtil {
    
    /**
     * Masks the given phone number, leaving the country/leading digits and trailing digits visible.
     * Example: +91 9876543210 -> +91*******3210
     */
    public static String mask(String phone) {
        if (phone == null) {
            return null;
        }
        int len = phone.length();
        if (len <= 7) {
            return "****";
        }
        return phone.substring(0, 3) + "*".repeat(len - 7) + phone.substring(len - 4);
    }
}
