package com.pqc.core.entity;

import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductOrderMappingTest {

    @Test
    void deliveryOtpColumnAllowsConfiguredSixDigitDeliveryOtp() throws NoSuchFieldException {
        Column column = ProductOrder.class.getDeclaredField("deliveryOtp").getAnnotation(Column.class);
        assertThat(column.length()).isGreaterThanOrEqualTo(6);
    }
}
