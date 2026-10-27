package com.pqc.core.config;

import com.pqc.core.service.MockPaymentGatewayAdapter;
import com.pqc.core.service.PaymentGatewayAdapter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class PaymentConfigurationValidatorTest {

    @Test
    void validate_allowsMock_inNonProdEnvironment() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("local-staging");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", "mock");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatCode(validator::validatePaymentConfiguration).doesNotThrowAnyException();
    }

    @Test
    void validate_allowsMock_inProd_whenPaidTransactionsDisabled() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", "mock");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", false);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatCode(validator::validatePaymentConfiguration).doesNotThrowAnyException();
    }

    @Test
    void validate_throwsException_inProd_whenPaidTransactionsEnabled_andProviderIsMock() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", "mock");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatThrownBy(validator::validatePaymentConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production environment cannot boot with mock payment provider while paid transactions are enabled");
    }

    @Test
    void validate_throwsException_inCombinedProdStagingProfiles_whenMockInProd() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("staging", "prod");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", "mock");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatThrownBy(validator::validatePaymentConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production environment cannot boot with mock payment provider while paid transactions are enabled");
    }

    @Test
    void validate_allowsRealProvider_inProd_whenRealAdapterRegistered() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        PaymentGatewayAdapter realAdapter = mock(PaymentGatewayAdapter.class);
        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env, realAdapter);
        ReflectionTestUtils.setField(validator, "paymentProvider", "razorpay");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatCode(validator::validatePaymentConfiguration).doesNotThrowAnyException();
    }

    @Test
    void validate_throwsException_whenRealProviderConfigured_butOnlyMockAdapterRegistered() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        MockPaymentGatewayAdapter mockAdapter = new MockPaymentGatewayAdapter(env);
        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env, mockAdapter);
        ReflectionTestUtils.setField(validator, "paymentProvider", "razorpay");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatThrownBy(validator::validatePaymentConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no certified non-mock PaymentGatewayAdapter implementation bean was found");
    }

    @Test
    void validate_throwsException_whenUnsupportedProviderConfigured() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", "crypto_unsupported");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", false);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatThrownBy(validator::validatePaymentConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsupported payment provider: 'crypto_unsupported'");
    }

    @Test
    void validate_throwsException_inProd_whenPaidTransactionsEnabled_andProviderIsBlank() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", "   ");
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatThrownBy(validator::validatePaymentConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production environment cannot boot with mock payment provider");
    }

    @Test
    void validate_throwsException_inProd_whenPaidTransactionsEnabled_andProviderIsNull() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        PaymentConfigurationValidator validator = new PaymentConfigurationValidator(env);
        ReflectionTestUtils.setField(validator, "paymentProvider", null);
        ReflectionTestUtils.setField(validator, "paidTransactionsEnabled", true);
        ReflectionTestUtils.setField(validator, "failIfMockInProd", true);

        assertThatThrownBy(validator::validatePaymentConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production environment cannot boot with mock payment provider");
    }
}
