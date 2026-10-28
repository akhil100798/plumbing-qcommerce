package com.pqc.core.config;

import com.pqc.core.service.MockPaymentGatewayAdapter;
import com.pqc.core.service.PaymentGatewayAdapter;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;

/**
 * Fail-safe production configuration validator for Payment & Payout operations.
 *
 * Ensures that if paid transactions are enabled in a production environment,
 * the application strictly refuses to start unless a certified, non-mock
 * payment provider (e.g. Razorpay, Stripe) is explicitly configured and
 * backed by a real adapter bean implementation.
 *
 * Detects unsupported payment providers and missing real adapter implementations.
 * Preserves mock payment adapter usage for local development and staging environments.
 */
@Component
@Slf4j
public class PaymentConfigurationValidator {

    private static final Set<String> SUPPORTED_PROVIDERS = Set.of("mock", "razorpay", "stripe");

    private final Environment environment;
    private final PaymentGatewayAdapter paymentGatewayAdapter;

    @Value("${app.payment.provider:mock}")
    private String paymentProvider;

    @Value("${app.payment.paid-transactions-enabled:false}")
    private boolean paidTransactionsEnabled;

    @Value("${app.payment.fail-if-mock-in-prod:true}")
    private boolean failIfMockInProd;

    public PaymentConfigurationValidator(Environment environment) {
        this(environment, null);
    }

    @Autowired
    public PaymentConfigurationValidator(Environment environment, @Lazy PaymentGatewayAdapter paymentGatewayAdapter) {
        this.environment = environment;
        this.paymentGatewayAdapter = paymentGatewayAdapter;
    }

    @PostConstruct
    public void validatePaymentConfiguration() {
        boolean isProd = environment != null && Arrays.asList(environment.getActiveProfiles()).contains("prod");

        log.info("[PAYMENT-CONFIG] Validating payment configuration: provider='{}', paidTransactionsEnabled={}, isProd={}, failIfMockInProd={}",
                paymentProvider, paidTransactionsEnabled, isProd, failIfMockInProd);

        if (paymentProvider == null || paymentProvider.isBlank()) {
            if (isProd && failIfMockInProd && paidTransactionsEnabled) {
                String errorMsg = "CRITICAL CONFIGURATION ERROR: Production environment cannot boot with mock payment provider while paid transactions are enabled! " +
                        "Configure a real, certified payment gateway (e.g. Razorpay, Stripe) or explicitly disable paid transactions.";
                log.error("[PAYMENT-CONFIG] {}", errorMsg);
                throw new IllegalStateException(errorMsg);
            }
            throw new IllegalStateException("Invalid payment configuration: 'app.payment.provider' must not be blank.");
        }

        String normalizedProvider = paymentProvider.trim().toLowerCase();
        if (!SUPPORTED_PROVIDERS.contains(normalizedProvider)) {
            String errorMsg = "Unsupported payment provider: '" + paymentProvider + "'. Supported providers are: " + SUPPORTED_PROVIDERS;
            log.error("[PAYMENT-CONFIG] {}", errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        // Detect missing real adapter implementation when a non-mock provider is configured
        if (!"mock".equalsIgnoreCase(normalizedProvider)) {
            if (paymentGatewayAdapter == null || paymentGatewayAdapter instanceof MockPaymentGatewayAdapter) {
                String errorMsg = "CRITICAL CONFIGURATION ERROR: Payment provider is configured as '" + paymentProvider +
                        "', but no certified non-mock PaymentGatewayAdapter implementation bean was found (only MockPaymentGatewayAdapter is registered).";
                log.error("[PAYMENT-CONFIG] {}", errorMsg);
                throw new IllegalStateException(errorMsg);
            }
        }

        if (isProd && failIfMockInProd && paidTransactionsEnabled) {
            if ("mock".equalsIgnoreCase(normalizedProvider)) {
                String errorMsg = "CRITICAL CONFIGURATION ERROR: Production environment cannot boot with mock payment provider while paid transactions are enabled! " +
                        "Configure a real, certified payment gateway (e.g. Razorpay, Stripe) or explicitly disable paid transactions.";
                log.error("[PAYMENT-CONFIG] {}", errorMsg);
                throw new IllegalStateException(errorMsg);
            }
        }

        if ("mock".equalsIgnoreCase(normalizedProvider)) {
            if (isProd) {
                log.warn("[PAYMENT-CONFIG] Mock payment adapter active in production profile, but paid transactions are disabled (dry-run mode).");
            } else {
                log.info("[PAYMENT-CONFIG] Mock payment adapter safely enabled for non-production environment.");
            }
        } else {
            log.info("[PAYMENT-CONFIG] Certified payment provider '{}' configured with registered adapter '{}'.",
                    paymentProvider, paymentGatewayAdapter.getClass().getSimpleName());
        }
    }
}
