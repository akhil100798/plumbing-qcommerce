package com.pqc.core.service;

import com.pqc.core.entity.LaunchPolicy;
import com.pqc.core.repository.LaunchPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LaunchPolicyService {
    public static final String SERVICE_POLICY_KEY = "SERVICE_LAUNCH";
    private static final java.util.Set<String> SUPPORTED_CURRENCIES = java.util.Set.of("INR");

    private final LaunchPolicyRepository repository;

    @Transactional(readOnly = true)
    public LaunchPolicy activePolicy() {
        List<LaunchPolicy> policies = repository.findAllByPolicyKeyAndActiveTrue(SERVICE_POLICY_KEY);
        if (policies.size() > 1) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Ambiguous active service launch policy");
        }
        return policies.isEmpty() ? null : policies.get(0);
    }

    @Transactional(readOnly = true)
    public Long requiredOwnedStoreId() {
        LaunchPolicy policy = activePolicy();
        if (policy == null || !policy.isServiceMaterialEnforcementEnabled()) return null;
        if (policy.getOwnedStoreId() == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Launch store is not configured");
        }
        return policy.getOwnedStoreId();
    }

    @Transactional(readOnly = true)
    public String authoritativeCurrency() {
        LaunchPolicy policy = activePolicy();
        String currency = policy == null || policy.getCurrency() == null ? "INR" : policy.getCurrency().trim().toUpperCase();
        if (currency.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Launch currency is not configured");
        }
        if (!SUPPORTED_CURRENCIES.contains(currency)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Launch currency is unsupported");
        }
        return currency;
    }

    @Transactional(readOnly = true)
    public BigDecimal authoritativeVisitFee() {
        LaunchPolicy policy = activePolicy();
        return policy == null || policy.getVisitFee() == null
                ? BigDecimal.ZERO.setScale(2)
                : policy.getVisitFee().setScale(2);
    }

    @Transactional(readOnly = true)
    public boolean launchRosterEnforced() {
        LaunchPolicy policy = activePolicy();
        return policy != null && policy.isActive() && policy.isRosterEnforcementEnabled();
    }

    @Transactional(readOnly = true)
    public LaunchPolicy requireServiceAreaPolicyIfConfigured() {
        LaunchPolicy policy = activePolicy();
        if (policy == null) return null;
        boolean anyAreaValue = policy.getServiceAreaCenterLatitude() != null
                || policy.getServiceAreaCenterLongitude() != null
                || policy.getServiceAreaRadiusKm() != null;
        boolean complete = policy.getServiceAreaCenterLatitude() != null
                && policy.getServiceAreaCenterLongitude() != null
                && policy.getServiceAreaRadiusKm() != null;
        if (anyAreaValue && !complete) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Launch service area is incompletely configured");
        }
        return policy;
    }

    public boolean isWithinServiceArea(Double latitude, Double longitude) {
        LaunchPolicy policy = requireServiceAreaPolicyIfConfigured();
        if (policy == null || policy.getServiceAreaCenterLatitude() == null) return true;
        if (latitude == null || longitude == null) return false;
        double dLat = Math.toRadians(latitude - policy.getServiceAreaCenterLatitude());
        double dLon = Math.toRadians(longitude - policy.getServiceAreaCenterLongitude());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(policy.getServiceAreaCenterLatitude()))
                * Math.cos(Math.toRadians(latitude))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double distanceKm = 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return distanceKm <= policy.getServiceAreaRadiusKm().doubleValue() + 1.0e-9;
    }
}
