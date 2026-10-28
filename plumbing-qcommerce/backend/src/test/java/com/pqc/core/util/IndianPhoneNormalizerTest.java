package com.pqc.core.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IndianPhoneNormalizerTest {

    @Test
    void normalizesSupportedIndianInputFormsToTheDomainIdentifier() {
        assertThat(IndianPhoneNormalizer.normalize("9876543210")).isEqualTo("9876543210");
        assertThat(IndianPhoneNormalizer.normalize("+919876543210")).isEqualTo("9876543210");
        assertThat(IndianPhoneNormalizer.normalize("+91 9876543210")).isEqualTo("9876543210");
    }

    @Test
    void rejectsMalformedPhoneInput() {
        for (String invalid : new String[]{null, "", "987654321", "98765432101", "+91 987654321", "+92 9876543210", "98765abc10", "+91-9876543210"}) {
            assertThat(IndianPhoneNormalizer.isSupported(invalid)).isFalse();
            assertThatThrownBy(() -> IndianPhoneNormalizer.normalize(invalid))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
