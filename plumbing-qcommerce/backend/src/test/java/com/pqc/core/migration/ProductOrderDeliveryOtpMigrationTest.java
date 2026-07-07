package com.pqc.core.migration;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductOrderDeliveryOtpMigrationTest {

    @Test
    void deliveryOtpColumnMigrationSupportsConfiguredSixDigitOtp() throws IOException {
        InputStream migrationStream = getClass().getClassLoader()
                .getResourceAsStream("db/migration/V12__expand_product_order_delivery_otp_length.sql");

        assertNotNull(migrationStream, "Expected V12 delivery OTP length migration");

        String migrationSql = new String(migrationStream.readAllBytes(), StandardCharsets.UTF_8);
        assertTrue(migrationSql.contains("delivery_otp"));
        assertTrue(migrationSql.contains("VARCHAR(16)"));
    }
}
