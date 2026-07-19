package com.pqc.core.service;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Phase 3 â€” Handles a plumber's mid-job request for parts/materials.
 *
 * Flow:
 *   1. Plumber calls createMaterialRequest() while IN_PROGRESS on a ServiceOrder.
 *   2. This creates a new ProductOrder (PENDING) linked to the ServiceOrder.
 *   3. ServiceOrder status upgrades to COMBINED_ORDER.
 *   4. Customer receives a WebSocket push (via OutboxEvent â†’ Kafka â†’ Edge Service).
 *   5. Customer confirms payment â†’ CheckoutService.confirmPayment() detects the
 *      serviceOrder link and emits an ORDER_CONFIRMED event for delivery dispatch.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlumberMaterialService {

    private final ServiceOrderRepository serviceOrderRepository;
    private final ProductOrderRepository productOrderRepository;
    private final OutboxEventRepository outboxRepository;
    private final CurrentUser currentUser;
    private final CheckoutService checkoutService;

    /**
     * Called by an IN_PROGRESS plumber to order parts mid-job.
     * Internally delegates to CheckoutService.reserveStock() so all
     * inventory-lock and reservation logic stays in one place.
     *
     * @param serviceOrderId   The active plumbing job this request belongs to.
     * @param storeId          Store the plumber wants to order from.
     * @param cartItems        List of products + quantities needed.
     * @return The newly created ProductOrder (status: PENDING payment).
     */
    @Transactional
    public ProductOrder createMaterialRequest(Long serviceOrderId, Long storeId,
                                              List<CartItemDTO> cartItems) {

        User actor = currentUser.require();
        if (actor.getRole() != Role.PLUMBER) {
            throw new AccessDeniedException("Only plumbers can raise material requests");
        }

        ServiceOrder serviceOrder = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service order not found: " + serviceOrderId));

        if (serviceOrder.getPlumber() == null
                || !serviceOrder.getPlumber().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the assigned plumber can request materials for this job");
        }

        if (serviceOrder.getStatus() != OrderStatus.IN_PROGRESS
                && serviceOrder.getStatus() != OrderStatus.COMBINED_ORDER) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Material requests can only be made while a job is IN_PROGRESS or COMBINED_ORDER. Current status: " + serviceOrder.getStatus());
        }

        // Reuse CheckoutService to reserve stock â€” the customer ID passed is the
        // service order's customer so the inventory lock is customer-attributed.
        Long customerId = serviceOrder.getCustomer().getId();
        Long targetStoreId = (serviceOrder.getStore() != null) ? serviceOrder.getStore().getId() : storeId;
        ProductOrder productOrder = checkoutService.reserveStock(customerId, targetStoreId, cartItems);

        // Link the product order back to the service order
        productOrder.setServiceOrder(serviceOrder);
        productOrderRepository.save(productOrder);

        // Promote the service order to COMBINED_ORDER
        serviceOrder.setStatus(OrderStatus.COMBINED_ORDER);
        serviceOrderRepository.save(serviceOrder);


        // Publish Outbox event â†’ Edge Service will push a WebSocket notification
        // to the customer so they see the payment approval card.
        String payload = buildMaterialRequestPayload(serviceOrder, productOrder, actor);
        OutboxEvent event = OutboxEvent.builder()
                .aggregateId(String.valueOf(productOrder.getId()))
                .aggregateType("PRODUCT_ORDER")
                .eventType("MATERIAL_REQUEST_CREATED")
                .topic("material-request-created")
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(event);

        log.info("Plumber #{} raised material request #{} for service job #{}. " +
                 "ServiceOrder promoted to COMBINED_ORDER.", actor.getId(),
                 productOrder.getId(), serviceOrderId);

        return productOrder;
    }

    // ---- helpers -------------------------------------------------------

    private String buildMaterialRequestPayload(ServiceOrder so, ProductOrder po, User plumber) {
        return "{" +
                "\"serviceOrderId\":" + so.getId() + "," +
                "\"productOrderId\":" + po.getId() + "," +
                "\"customerId\":" + so.getCustomer().getId() + "," +
                "\"plumberId\":" + plumber.getId() + "," +
                "\"plumberName\":\"" + plumber.getFullName() + "\"," +
                "\"totalAmount\":" + po.getTotalAmount() +
                "}";
    }
}
