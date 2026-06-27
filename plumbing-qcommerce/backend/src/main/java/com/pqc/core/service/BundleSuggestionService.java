package com.pqc.core.service;

import com.pqc.core.entity.RequestType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Bundle Suggestion Service — Phase 5 AI Optimization
 *
 * Maps plumber service RequestType to recommended product bundles.
 * Acts as a rule-based recommender engine; adapter interface allows
 * future swap-in of an ML model without changing the controller.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BundleSuggestionService {

    /** Static lookup table: RequestType → recommended product names + reason */
    private static final Map<RequestType, List<Map<String, String>>> BUNDLE_MAP = Map.of(

        RequestType.NEARBY_AUTO, List.of(
            Map.of("name", "PVC Pipe 1\"",        "reason", "Most common pipe for rapid auto-assigned repairs"),
            Map.of("name", "Elbow Joint 90°",     "reason", "Required for pipe rerouting"),
            Map.of("name", "Teflon Tape",          "reason", "Essential thread sealant for any fitting"),
            Map.of("name", "Plumber Putty",        "reason", "Seals drain and faucet fixtures quickly")
        ),

        RequestType.STORE_ROUTED, List.of(
            Map.of("name", "Tap Washer Set",       "reason", "Replace all washers during store-coordinated service"),
            Map.of("name", "O-Ring Assortment",    "reason", "Common failure point in taps and valves"),
            Map.of("name", "Pipe Wrench",           "reason", "Heavy-duty tool for store-dispatched jobs"),
            Map.of("name", "PTFE Thread Tape",      "reason", "Prevents thread corrosion on new fittings")
        ),

        RequestType.DIRECT_PLUMBER, List.of(
            Map.of("name", "Pipe Repair Clamp",    "reason", "Quick fix for burst pipes — no soldering needed"),
            Map.of("name", "Leak Seal Epoxy",      "reason", "Fast-cure sealant for leaks"),
            Map.of("name", "Rubber Gasket Kit",    "reason", "Universal gasket replacement for direct bookings"),
            Map.of("name", "Pipe Cutter",           "reason", "Clean cuts for pipe replacement work")
        )
    );

    /** Default bundle used when RequestType is unrecognised */
    private static final List<Map<String, String>> DEFAULT_BUNDLE = List.of(
        Map.of("name", "Teflon Tape",            "reason", "Universal — useful for any plumbing job"),
        Map.of("name", "Adjustable Spanner",     "reason", "Essential multi-purpose tool"),
        Map.of("name", "PVC Pipe Cement",         "reason", "Bonds PVC joints securely")
    );

    /**
     * Returns the recommended product bundle for a given service type.
     *
     * @param requestType the plumber service request type string
     * @return list of product suggestions with names and reasoning
     */
    public List<Map<String, String>> getSuggestionsForServiceType(String requestType) {
        log.info("Fetching bundle suggestions for service type: {}", requestType);
        try {
            RequestType type = RequestType.valueOf(requestType.toUpperCase());
            return BUNDLE_MAP.getOrDefault(type, DEFAULT_BUNDLE);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown RequestType '{}', returning default bundle", requestType);
            return DEFAULT_BUNDLE;
        }
    }

    /**
     * Returns all available service type keys for the frontend dropdown.
     */
    public List<String> getAvailableServiceTypes() {
        return List.of(
            RequestType.NEARBY_AUTO.name(),
            RequestType.STORE_ROUTED.name(),
            RequestType.DIRECT_PLUMBER.name()
        );
    }
}
