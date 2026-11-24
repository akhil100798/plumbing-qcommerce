package com.pqc.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class Phase2QuoteService {
    private final ServiceQuoteRepository quotes;
    private final ServiceQuoteLineRepository lines;
    private final ServiceDiagnosisRepository diagnoses;
    private final ServiceOrderRepository orders;
    private final ServicePricingCatalogRepository catalogs;
    private final ServicePricingCatalogLineRepository catalogLines;
    private final Phase2IdempotencyService idempotency;
    private final ServiceQuoteEventService events;
    private final ServiceQuoteEventRepository quoteEvents;
    private final CurrentUser currentUser;
    private final ProductOrderRepository materialRequests;
    private final ProductOrderItemRepository materialItems;
    private final ServiceQuoteMaterialLinkRepository materialLinks;
    private final Phase2AuthorizationService phase2Authorization;
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    public Phase2QuoteService(ServiceQuoteRepository quotes, ServiceQuoteLineRepository lines,
                              ServiceDiagnosisRepository diagnoses, ServiceOrderRepository orders,
                              ServicePricingCatalogRepository catalogs, ServicePricingCatalogLineRepository catalogLines,
                              Phase2IdempotencyService idempotency, ServiceQuoteEventService events,
                              ServiceQuoteEventRepository quoteEvents, CurrentUser currentUser,
                              ProductOrderRepository materialRequests, ProductOrderItemRepository materialItems,
                              ServiceQuoteMaterialLinkRepository materialLinks,
                              Phase2AuthorizationService phase2Authorization) {
        this.quotes = quotes; this.lines = lines; this.diagnoses = diagnoses; this.orders = orders;
        this.catalogs = catalogs; this.catalogLines = catalogLines; this.idempotency = idempotency;
        this.events = events; this.quoteEvents = quoteEvents; this.currentUser = currentUser;
        this.materialRequests = materialRequests; this.materialItems = materialItems; this.materialLinks = materialLinks;
        this.phase2Authorization = phase2Authorization;
    }

    private void replaceAddendumLines(ServiceOrder order, ServiceQuote addendum,
                                      List<MaterialAddendumLineRequest> requestedLines,
                                      Long catalogId, boolean update,
                                      boolean allowCompletedForReconciliation) {
        if (requestedLines == null || requestedLines.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one material item is required");
        ServiceQuote base = quotes.findByIdForUpdate(addendum.getBaseQuote().getId()).orElseThrow(() -> notFound("Base quote not found"));
        validateBase(order.getId(), base);
        Long requestId = requestedLines.get(0).materialRequestId();
        if (requestedLines.stream().anyMatch(line -> !Objects.equals(requestId, line.materialRequestId()))) throw conflict("One addendum may link only one material request");
        if (addendum.getId() != null && materialRequests.findById(requestId).map(ProductOrder::getServiceOrder).map(ServiceOrder::getId).filter(order.getId()::equals).isEmpty()) throw conflict("Material request does not belong to this service order");
        ProductOrder request = materialRequests.lockMaterialRequest(requestId).orElseThrow(() -> notFound("Material request not found"));
        validateRequest(order, request, allowCompletedForReconciliation);
        if (addendum.getMaterialRequestId() != null && !Objects.equals(addendum.getMaterialRequestId(), request.getId()))
            throw conflict("Draft addendum material request cannot be changed");
        if (addendum.getMaterialRequestId() == null) addendum.setMaterialRequestId(request.getId());
        Set<Long> seenItems = new HashSet<>();
        if (update) {
            List<ServiceQuoteMaterialLink> existingLinks = materialLinks.findByQuoteIdForUpdate(addendum.getId());
            if (existingLinks.stream().anyMatch(link -> !Objects.equals(link.getMaterialRequestId(), request.getId())))
                throw conflict("Draft addendum material request cannot be changed");
            if (existingLinks.stream().anyMatch(link -> link.getAuthorizationState() != MaterialAuthorizationState.PENDING))
                throw conflict("Draft addendum contains a non-pending material authorization");
            lines.deleteByQuoteIdAndFlush(addendum.getId());
            materialLinks.deleteByQuoteIdAndState(addendum.getId(), MaterialAuthorizationState.PENDING);
        }
        ServicePricingCatalog catalog = null;
        if (catalogId != null) catalog = selectCatalog(catalogId);
        for (MaterialAddendumLineRequest input : requestedLines) {
            if (!seenItems.add(input.materialItemId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate item in addendum");
            ProductOrderItem item = materialItems.findByIdForUpdate(input.materialItemId()).orElseThrow(() -> notFound("Material request item not found"));
            validateItem(request, item);
            boolean alreadyLinkedToAnotherDraft = materialLinks.findByMaterialRequestIdAndAuthorizationStateIn(request.getId(), List.of(MaterialAuthorizationState.PENDING)).stream()
                    .anyMatch(existing -> Objects.equals(existing.getMaterialItemId(), item.getId()) && !Objects.equals(existing.getQuoteId(), addendum.getId()));
            if (alreadyLinkedToAnotherDraft) throw conflict("Material item already belongs to another pending authorization");
            if ((request.getStatus() == ProductOrderStatus.COLLECTED || request.getStatus() == ProductOrderStatus.DELIVERED)
                    && !allowCompletedForReconciliation)
                throw conflict("Collected or consumed materials cannot be re-added");
            if (materialLinks.existsByMaterialItemIdAndAuthorizationStateIn(item.getId(), List.of(MaterialAuthorizationState.PENDING, MaterialAuthorizationState.ACTIVE))) {
                boolean sameDraft = materialLinks.findFirstByQuoteIdAndMaterialItemId(addendum.getId(), item.getId()).filter(l -> l.getAuthorizationState() == MaterialAuthorizationState.PENDING).isPresent();
                if (!sameDraft) throw conflict("Material item already has pending or active authorization");
            }
            BigDecimal quantity = validatedQuantity(input.quantity());
            int storeAuthorizedQuantity = item.getReservedQuantity() == null ? 0 : item.getReservedQuantity();
            if (quantity.compareTo(BigDecimal.valueOf(item.getQuantity())) > 0 || quantity.compareTo(BigDecimal.valueOf(storeAuthorizedQuantity)) > 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Addendum quantity exceeds the store-authorized linked item quantity");
            BigDecimal unitPrice;
            String unit;
            String source;
            Long catalogLineId = null;
            Integer catalogVersion = null;
            if (input.pricingCatalogLineId() != null) {
                if (catalog == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A pricing catalog is required for a catalog line");
                ServicePricingCatalogLine catalogLine = catalogLines.findById(input.pricingCatalogLineId()).orElseThrow(() -> notFound("Pricing catalog line not found"));
                if (!Objects.equals(catalogLine.getPricingCatalogId(), catalog.getId()) || !"MATERIAL".equals(catalogLine.getLineType())) throw conflict("Catalog line must be MATERIAL and belong to selected catalog");
                if (catalogLine.getAmount() == null || catalogLine.getAmount().signum() < 0) throw conflict("Catalog line price must be nonnegative");
                validateCatalogQuantity(catalogLine, quantity);
                unitPrice = catalogLine.getAmount(); unit = catalogLine.getUnit().trim(); source = "CATALOG";
                catalogLineId = catalogLine.getId(); catalogVersion = catalog.getVersion();
            } else {
                if (catalogId != null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every line must use the selected catalog");
                Set<ProductOrderStatus> pricedStatuses = new HashSet<>(Set.of(ProductOrderStatus.APPROVED, ProductOrderStatus.PARTIALLY_AVAILABLE, ProductOrderStatus.RESERVED,
                        ProductOrderStatus.PREPARING, ProductOrderStatus.PACKING, ProductOrderStatus.READY_FOR_PICKUP,
                        ProductOrderStatus.PLUMBER_AT_STORE));
                if (allowCompletedForReconciliation) {
                    pricedStatuses.add(ProductOrderStatus.COLLECTED);
                    pricedStatuses.add(ProductOrderStatus.DELIVERED);
                }
                if (!pricedStatuses.contains(request.getStatus())) throw conflict("Store pricing is not available for this material request");
                boolean storeHasPricedItem = !ProductOrderStatus.REQUESTED.equals(request.getStatus())
                        && !ProductOrderStatus.STORE_REVIEWING.equals(request.getStatus())
                        && request.getStore() != null;
                if (!storeHasPricedItem) throw conflict("Store must price this item before addendum creation");
                if (item.getUnitPriceSnapshot() == null && item.getPricingCatalogLineId() == null) {
                    BigDecimal catalogBackedStorePrice = item.getPrice();
                    if (catalogBackedStorePrice == null || catalogBackedStorePrice.signum() < 0) throw conflict("Store-priced material line has no authoritative price");
                    item.setUnitPriceSnapshot(catalogBackedStorePrice);
                }
                unitPrice = item.getUnitPriceSnapshot() != null ? item.getUnitPriceSnapshot() : item.getPrice();
                unit = item.getUnit() == null || item.getUnit().isBlank() ? "UNIT" : item.getUnit().trim();
                source = "STORE";
                if (unitPrice == null || unitPrice.signum() < 0) throw conflict("Store-priced material line has no authoritative price");
                materialItems.initializeUnitIfDefault(item.getId(), unit);
                item.setUnit(unit); item.setUnitPriceSnapshot(unitPrice); item.setPricingSource("STORE"); materialItems.save(item);
            }
            if (catalog != null && addendum.getPricingCatalogId() != null && !Objects.equals(addendum.getPricingCatalogId(), catalog.getId())) throw conflict("Draft addendum catalog cannot be changed");
            if (catalog != null) { addendum.setPricingCatalogId(catalog.getId()); addendum.setPricingCatalogVersion(catalog.getVersion()); }
            BigDecimal lineTotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            ServiceQuoteMaterialLink link = ServiceQuoteMaterialLink.builder().serviceOrderId(order.getId()).quoteId(addendum.getId())
                    .materialRequestId(request.getId()).materialItemId(item.getId()).linkType("MATERIAL")
                    .authorizationState(MaterialAuthorizationState.PENDING).build();
            link = materialLinks.saveAndFlush(link);
            item.setUnit(unit); item.setUnitPriceSnapshot(unitPrice); item.setPricingSource(source);
            item.setPricingCatalogLineId(catalogLineId); item.setPricingCatalogVersion(catalogVersion);
            materialItems.save(item);
            ServiceQuoteLine line = ServiceQuoteLine.builder().quote(addendum).materialLinkId(link.getId()).materialRequestId(request.getId()).materialItemId(item.getId())
                    .lineType("MATERIAL").description(item.getProduct().getName()).amount(lineTotal).lineTotal(lineTotal)
                    .quantity(quantity).unit(unit).unitPrice(unitPrice).pricingSource(source)
                    .pricingCatalogLineId(catalogLineId).pricingSourceVersion(catalogVersion).build();
            lines.save(line);
        }
        if (catalogId == null) { addendum.setPricingCatalogId(null); addendum.setPricingCatalogVersion(null); }
        addendum.setLaborSubtotal(BigDecimal.ZERO.setScale(2));
        addendum.setKnownMaterialSubtotal(money(lines.findByQuoteIdOrderByIdAsc(addendum.getId()).stream().map(ServiceQuoteLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add)));
        addendum.setAmount(addendum.getKnownMaterialSubtotal()); addendum.setCurrency("INR");
        quotes.saveAndFlush(addendum);
    }

    private void validateBase(Long orderId, ServiceQuote base) {
        if (!base.getServiceOrder().getId().equals(orderId) || !Set.of(QuoteKind.INITIAL, QuoteKind.REVISION).contains(base.getQuoteKind())
                || base.getState() != QuoteState.APPROVED || base.getApprovedAt() == null) throw conflict("Base quote must be an approved initial-scope quote for this service order");
        if (quotes.findFirstByServiceOrderIdAndQuoteKindAndState(orderId, base.getQuoteKind(), QuoteState.APPROVED).map(q -> !q.getId().equals(base.getId())).orElse(false)) throw conflict("Base quote is not the applicable approved repair quote");
        if (quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(orderId, base.getQuoteKind()).stream()
                .anyMatch(q -> q.getVersion() > base.getVersion() && q.getState() != QuoteState.CANCELLED))
            throw conflict("Base quote has been replaced and is no longer applicable");
    }

    private void validateRequest(ServiceOrder order, ProductOrder request) {
        validateRequest(order, request, false);
    }

    private void validateRequest(ServiceOrder order, ProductOrder request, boolean allowCompletedForReconciliation) {
        if (request.getServiceOrder() == null || !request.getServiceOrder().getId().equals(order.getId()) || !request.getCustomer().getId().equals(order.getCustomer().getId())) throw conflict("Material request does not belong to this service order");
        Set<ProductOrderStatus> eligibleStatuses = new HashSet<>(Set.of(ProductOrderStatus.APPROVED, ProductOrderStatus.PARTIALLY_AVAILABLE, ProductOrderStatus.RESERVED,
                ProductOrderStatus.PREPARING, ProductOrderStatus.PACKING, ProductOrderStatus.READY_FOR_PICKUP,
                ProductOrderStatus.PLUMBER_AT_STORE));
        if (allowCompletedForReconciliation) {
            eligibleStatuses.add(ProductOrderStatus.COLLECTED);
            eligibleStatuses.add(ProductOrderStatus.DELIVERED);
        }
        if (!eligibleStatuses.contains(request.getStatus()))
            throw conflict("Material request must be store-approved before addendum authorization");
    }

    private void validateItem(ProductOrder request, ProductOrderItem item) {
        if (item.getOrder() == null || !item.getOrder().getId().equals(request.getId())) throw conflict("Material item does not belong to the linked product order");
        if (item.getQuantity() == null || item.getQuantity() < 1) throw conflict("Material item quantity is invalid");
    }

    private void validateMaterialRequestAndItems(ServiceOrder order, ServiceQuote addendum,
                                                 List<ServiceQuoteMaterialLink> links, boolean approval,
                                                 boolean allowCompletedForReconciliation) {
        Set<Long> requestIds = new TreeSet<>();
        links.stream().map(ServiceQuoteMaterialLink::getMaterialRequestId).forEach(requestIds::add);
        Map<Long, ProductOrder> requestRows = new HashMap<>();
        for (Long requestId : requestIds) {
            ProductOrder request = materialRequests.lockMaterialRequest(requestId).orElseThrow(() -> notFound("Material request not found"));
            validateRequest(order, request, allowCompletedForReconciliation);
            requestRows.put(requestId, request);
        }
        if (links.stream().anyMatch(link -> link.getAuthorizationState() != MaterialAuthorizationState.PENDING))
            throw conflict("Addendum links are not pending customer authorization");
        Set<Long> itemIds = new TreeSet<>();
        links.stream().map(ServiceQuoteMaterialLink::getMaterialItemId).filter(Objects::nonNull).forEach(itemIds::add);
        Map<Long, ProductOrderItem> itemRows = new HashMap<>();
        for (Long itemId : itemIds) {
            ProductOrderItem item = materialItems.findByIdForUpdate(itemId).orElseThrow(() -> notFound("Material request item not found"));
            itemRows.put(itemId, item);
        }
        Map<Long, List<ServiceQuoteMaterialLink>> byItem = new HashMap<>();
        links.stream().filter(link -> link.getMaterialItemId() != null)
                .forEach(link -> byItem.computeIfAbsent(link.getMaterialItemId(), ignored -> new ArrayList<>()).add(link));
        for (Map.Entry<Long, List<ServiceQuoteMaterialLink>> entry : byItem.entrySet()) {
            ProductOrderItem item = itemRows.get(entry.getKey());
            ProductOrder request = requestRows.get(entry.getValue().get(0).getMaterialRequestId());
            if ((request.getStatus() == ProductOrderStatus.COLLECTED || request.getStatus() == ProductOrderStatus.DELIVERED)
                    && !allowCompletedForReconciliation)
                throw conflict("Collected materials cannot be newly authorized");
            if (!allowCompletedForReconciliation && item.getPackedQuantity() != null && item.getPackedQuantity() > 0)
                throw conflict("Packed materials cannot be newly authorized");
        }
        if (approval) {
            List<ServiceQuoteLine> addendumLines = lines.findByQuoteIdOrderByIdAsc(addendum.getId());
            BigDecimal computed = BigDecimal.ZERO;
            Set<Long> linkedItemIds = new HashSet<>();
            for (ServiceQuoteLine line : addendumLines) {
                if (!"MATERIAL".equals(line.getLineType()) || line.getMaterialItemId() == null
                        || line.getMaterialRequestId() == null || line.getMaterialLinkId() == null || line.getQuantity() == null || line.getUnitPrice() == null
                        || line.getLineTotal() == null || line.getLineTotal().compareTo(money(line.getQuantity().multiply(line.getUnitPrice()))) != 0
                        || !linkedItemIds.add(line.getMaterialItemId())) throw conflict("Addendum line snapshot is invalid");
                ServiceQuoteMaterialLink link = links.stream().filter(candidate -> Objects.equals(candidate.getId(), line.getMaterialLinkId())
                                && Objects.equals(candidate.getMaterialItemId(), line.getMaterialItemId())).findFirst()
                        .orElseThrow(() -> conflict("Addendum line is not linked"));
                if (!Objects.equals(link.getMaterialRequestId(), line.getMaterialRequestId())) throw conflict("Addendum request/item ownership mismatch");
                ProductOrderItem linkedItem = itemRows.get(line.getMaterialItemId());
                if (linkedItem == null || linkedItem.getReservedQuantity() == null
                        || line.getQuantity().compareTo(BigDecimal.valueOf(linkedItem.getReservedQuantity())) > 0)
                    throw conflict("Addendum quantity exceeds the store-authorized linked item quantity");
                if (addendum.getPricingCatalogId() == null && (!"STORE".equals(line.getPricingSource()) || line.getPricingCatalogLineId() != null))
                    throw conflict("Catalog omission requires store-priced material lines");
                if (addendum.getPricingCatalogId() != null && (!"CATALOG".equals(line.getPricingSource()) || line.getPricingCatalogLineId() == null
                        || !Objects.equals(line.getPricingSourceVersion(), addendum.getPricingCatalogVersion())))
                    throw conflict("Catalog-backed material snapshot is incomplete");
                computed = computed.add(line.getLineTotal());
            }
            if (addendumLines.isEmpty() || linkedItemIds.size() != links.size()
                    || addendum.getLaborSubtotal().signum() != 0
                    || addendum.getKnownMaterialSubtotal().compareTo(money(computed)) != 0
                    || addendum.getAmount().compareTo(money(computed)) != 0
                    || !"INR".equals(addendum.getCurrency())) throw conflict("Addendum snapshot totals are invalid");
        }
        for (ServiceQuoteMaterialLink link : links) {
            ProductOrder request = requestRows.get(link.getMaterialRequestId());
            if (link.getMaterialItemId() != null) {
                ProductOrderItem item = itemRows.get(link.getMaterialItemId());
                validateItem(request, item);
                if (approval && (item.getReservedQuantity() == null || item.getReservedQuantity() < 1))
                    throw conflict("Store-authorized quantity is missing");
            }
        }
    }

    private boolean isCurrentAddendum(Long orderId, ServiceQuote addendum) {
        return quotes.findByServiceOrderIdAndBaseQuoteIdAndQuoteKindOrderByVersionDesc(
                        orderId, addendum.getBaseQuote().getId(), QuoteKind.MATERIAL_ADDENDUM)
                .stream().findFirst().map(q -> q.getId().equals(addendum.getId())).orElse(false);
    }

    private ServiceQuote expireAddendumIfNeeded(ServiceQuote addendum, User actor) {
        if (addendum.getState() == QuoteState.PUBLISHED && addendum.getExpiresAt() != null && !LocalDateTime.now().isBefore(addendum.getExpiresAt())) {
            addendum.setState(QuoteState.EXPIRED); addendum = quotes.saveAndFlush(addendum);
            List<ServiceQuoteMaterialLink> links = materialLinks.findByQuoteIdForUpdate(addendum.getId());
            links.stream().filter(link -> link.getAuthorizationState() == MaterialAuthorizationState.PENDING)
                    .forEach(link -> link.setAuthorizationState(MaterialAuthorizationState.EXPIRED));
            materialLinks.saveAll(links);
            try { emitAddendum(addendum, "ADDENDUM_EXPIRED", QuoteState.PUBLISHED, QuoteState.EXPIRED, actor, null, "expiry", true); }
            catch (org.springframework.dao.DataIntegrityViolationException duplicateExpiry) {
                // A parallel scheduler or decision recorded the same stable transition.
            }
        }
        return addendum;
    }

    private void emitAddendum(ServiceQuote quote, String type, QuoteState from, QuoteState to, User actor, Long idem, String reason, boolean outboxEvent) {
        String transitionKey = idem == null ? type : type + ":" + idem;
        if (transitionKey.length() > 64) transitionKey = transitionKey.substring(0, 64);
        ServiceQuoteEvent event = ServiceQuoteEvent.builder().serviceOrderId(quote.getServiceOrder().getId()).diagnosisId(quote.getDiagnosis() == null ? null : quote.getDiagnosis().getId())
                .quoteId(quote.getId()).aggregateType("QUOTE").aggregateId(quote.getId()).transitionKey(transitionKey).eventType(type)
                .fromState(from == null ? null : from.name()).toState(to.name()).actorId(actor == null ? null : actor.getId())
                .actorRole(actor == null ? null : actor.getRole().name()).reason(reason).idempotencyKeyId(idem).build();
        if (outboxEvent) events.record(event, "phase2.addendum", type);
        else events.recordAuditOnly(event);
    }

    private void requireAddendum(ServiceQuote quote) {
        if (quote.getQuoteKind() != QuoteKind.MATERIAL_ADDENDUM || quote.getBaseQuote() == null) throw conflict("Quote is not a material addendum");
    }

    private BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
    private PlumberMaterialAddendumResponse plumberAddendumResponse(ServiceQuote quote) { return PlumberMaterialAddendumResponse.from(quote, lines.findByQuoteIdOrderByIdAsc(quote.getId()).stream().map(QuoteLineResponse::from).toList()); }
    private CustomerMaterialAddendumResponse customerAddendumResponse(ServiceQuote quote) { return CustomerMaterialAddendumResponse.from(quote, lines.findByQuoteIdOrderByIdAsc(quote.getId()).stream().map(QuoteLineResponse::from).toList()); }
    private PlumberMaterialAddendumResponse readPlumberAddendum(String json) { try { return mapper.readValue(json, PlumberMaterialAddendumResponse.class); } catch (Exception e) { throw new IllegalStateException(e); } }
    private CustomerMaterialAddendumResponse readCustomerAddendum(String json) { try { return mapper.readValue(json, CustomerMaterialAddendumResponse.class); } catch (Exception e) { throw new IllegalStateException(e); } }

    @Transactional
    public PlumberQuoteResponse updateDraft(Long orderId, Long quoteId, QuoteDraftUpdateRequest request, String key) {
        User actor = plumber();
        var claim = idempotency.begin(actor.getId(), "UPDATE_QUOTE", "QUOTE", quoteId, required(key), "draft:" + quoteId + ":" + request.pricingCatalogLineId() + ":" + request.quantity());
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readPlumber(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found")); assigned(order, actor);
        ServiceQuote quote = quoteForUpdate(quoteId, orderId);
        if (quote.getState() != QuoteState.DRAFT) throw conflict("Only a draft quote may be edited");
        ServicePricingCatalogLine source = catalogLines.findById(request.pricingCatalogLineId()).orElseThrow(() -> notFound("Pricing catalog line not found"));
        BigDecimal quantity = validatedQuantity(request.quantity());
        ServicePricingCatalog catalog = catalogs.findById(source.getPricingCatalogId())
                .filter(c -> "ACTIVE".equals(c.getStatus()) && "INR".equals(c.getCurrency())
                        && !c.getEffectiveFrom().isAfter(LocalDateTime.now())
                        && (c.getEffectiveTo() == null || c.getEffectiveTo().isAfter(LocalDateTime.now())))
                .orElseThrow(() -> conflict("Pricing catalog is not active"));
        if (!Set.of("LABOR", "MATERIAL").contains(source.getLineType())) throw conflict("Only repair-scope catalog lines may be quoted");
        validateCatalogQuantity(source, quantity);
        lines.deleteAll(lines.findByQuoteIdOrderByIdAsc(quoteId));
        BigDecimal total = source.getAmount().multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        lines.saveAndFlush(ServiceQuoteLine.builder().quote(quote).lineType(source.getLineType()).description(source.getLineKey()).amount(total).pricingSource("CATALOG").pricingCatalogLineId(source.getId()).quantity(quantity).unit(source.getUnit().trim()).unitPrice(source.getAmount()).lineTotal(total).pricingSourceVersion(catalog.getVersion()).build());
        quote.setPricingCatalogId(catalog.getId()); quote.setPricingCatalogVersion(catalog.getVersion()); quote.setCurrency(catalog.getCurrency());
        if ("LABOR".equals(source.getLineType())) { quote.setLaborSubtotal(total); quote.setKnownMaterialSubtotal(BigDecimal.ZERO); } else { quote.setLaborSubtotal(BigDecimal.ZERO); quote.setKnownMaterialSubtotal(total); }
        quote.setAmount(total); quote = quotes.saveAndFlush(quote);
        PlumberQuoteResponse out = plumberResponse(quote); idempotency.complete(claim.getId(), json(out)); return out;
    }

    @Transactional
    public PlumberQuoteResponse plumberRead(Long orderId, Long quoteId) {
        User actor = plumber(); ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found")); assigned(order, actor);
        return plumberResponse(expireIfNeeded(quoteForUpdate(quoteId, orderId)));
    }

    @Transactional(readOnly = true)
    public PlumberQuoteResponse currentForPlumber(Long orderId) {
        User actor = plumber();
        ServiceOrder order = orders.findById(orderId).orElseThrow(() -> notFound("Service order not found"));
        assigned(order, actor);
        ServiceQuote current = quotes.findByServiceOrderIdOrderByVersionDesc(orderId).stream()
                .filter(quote -> quote.getQuoteKind() == QuoteKind.INITIAL || quote.getQuoteKind() == QuoteKind.REVISION)
                .filter(quote -> quote.getState() != QuoteState.SUPERSEDED && quote.getState() != QuoteState.CANCELLED)
                .max(Comparator.comparing(ServiceQuote::getVersion))
                .orElseThrow(() -> notFound("Current quote not found"));
        return plumberResponse(current);
    }

    @Transactional(readOnly = true)
    public List<AdminQuoteHistoryResponse> adminHistory(Long orderId) {
        User actor = currentUser.require(); if (!isOperator(actor)) throw new AccessDeniedException("Operations access required");
        orders.findById(orderId).orElseThrow(() -> notFound("Service order not found"));
        return quotes.findByServiceOrderIdOrderByVersionAsc(orderId).stream().map(quote -> {
            LocalDateTime supersededAt = quoteEvents.findByQuoteIdOrderByCreatedAtAsc(quote.getId()).stream()
                    .filter(event -> "QUOTE_SUPERSEDED".equals(event.getEventType()))
                    .map(ServiceQuoteEvent::getCreatedAt).findFirst().orElse(null);
            LocalDateTime cancelledAt = quote.getState() == QuoteState.CANCELLED
                    ? quoteEvents.findByAggregateTypeAndAggregateIdAndTransitionKeyAndEventType(
                            "SERVICE_ORDER", orderId, "PHASE2_CANCELLED", "PHASE2_CANCELLED")
                            .map(ServiceQuoteEvent::getCreatedAt)
                            .or(() -> Optional.ofNullable(quote.getDiagnosis()).map(ServiceDiagnosis::getCancelledAt))
                            .or(() -> Optional.ofNullable(quote.getServiceOrder().getCancelledAt()))
                            .orElse(null)
                    : null;
            return AdminQuoteHistoryResponse.from(quote, supersededAt,
                    cancelledAt,
                    lines.findByQuoteIdOrderByIdAsc(quote.getId()).stream().map(QuoteLineResponse::from).toList());
        }).toList();
    }

    @Transactional
    public PlumberMaterialAddendumResponse createAddendum(Long orderId, MaterialAddendumCreateRequest request, String key) {
        User actor = plumber();
        String fingerprint = fingerprint("addendum:create:" + orderId + ":" + request.baseQuoteId() + ":" + request.supersedesAddendumId() + ":" + request.pricingCatalogId() + ":" + request.lines() + ":" + request.reason());
        var claim = idempotency.begin(actor.getId(), "CREATE_MATERIAL_ADDENDUM", "SERVICE_ORDER", orderId, required(key), fingerprint);
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readPlumberAddendum(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found"));
        assigned(order, actor);
        List<Phase2Reconciliation> liveReconciliations = phase2Authorization.lockLiveReconciliations(orderId);
        boolean reconciliationCorrection = liveReconciliations.size() == 1
                && liveReconciliations.get(0).getStatus() == ReconciliationState.OPEN
                && liveReconciliations.get(0).getCorrectionType() == null;
        ServiceQuote base = quotes.findByIdForUpdate(request.baseQuoteId()).orElseThrow(() -> notFound("Base quote not found"));
        validateBase(orderId, base);
        List<ServiceQuote> history = quotes.findByServiceOrderIdAndBaseQuoteIdAndQuoteKindOrderByVersionDesc(orderId, base.getId(), QuoteKind.MATERIAL_ADDENDUM);
        if (history.stream().anyMatch(q -> Set.of(QuoteState.DRAFT, QuoteState.PUBLISHED).contains(q.getState()))) throw conflict("An open addendum already exists for this base quote");
        int version = 1;
        ServiceQuote superseded = null;
        if (!history.isEmpty() && request.supersedesAddendumId() == null) throw conflict("An addendum correction must explicitly supersede the prior attempt");
        if (request.supersedesAddendumId() != null) {
            superseded = quotes.findByIdForUpdate(request.supersedesAddendumId()).orElseThrow(() -> notFound("Prior addendum not found"));
            if (superseded.getQuoteKind() != QuoteKind.MATERIAL_ADDENDUM || superseded.getVersion() != 1
                    || !Objects.equals(superseded.getBaseQuote().getId(), base.getId())
                    || !Set.of(QuoteState.REJECTED, QuoteState.EXPIRED, QuoteState.CANCELLED).contains(superseded.getState())
                    || quotes.findBySupersedesQuoteId(superseded.getId()).size() > 0) throw conflict("Prior addendum is not eligible for its one correction");
            if (history.size() != 1 || !Objects.equals(history.get(0).getId(), superseded.getId())) throw conflict("Only one addendum correction is permitted");
            if (request.reason() == null || request.reason().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A correction reason is required");
            version = 2;
        }
        ServiceQuote addendum = quotes.saveAndFlush(ServiceQuote.builder().serviceOrder(order).diagnosis(base.getDiagnosis())
                .quoteKind(QuoteKind.MATERIAL_ADDENDUM).version(version).state(QuoteState.DRAFT)
                .amount(BigDecimal.ZERO).laborSubtotal(BigDecimal.ZERO).knownMaterialSubtotal(BigDecimal.ZERO)
                .currency("INR").baseQuote(base).supersedesQuoteId(superseded == null ? null : superseded.getId()).build());
        replaceAddendumLines(order, addendum, request.lines(), request.pricingCatalogId(), true, reconciliationCorrection);
        emitAddendum(addendum, "ADDENDUM_CREATED", null, QuoteState.DRAFT, actor, claim.getId(), request.reason(), false);
        PlumberMaterialAddendumResponse out = plumberAddendumResponse(addendum);
        idempotency.complete(claim.getId(), json(out));
        return out;
    }

    @Transactional
    public PlumberMaterialAddendumResponse updateAddendum(Long orderId, Long addendumId, MaterialAddendumUpdateRequest request, String key) {
        User actor = plumber();
        String fingerprint = fingerprint("addendum:update:" + addendumId + ":" + request.materialRequestId() + ":" + request.pricingCatalogId() + ":" + request.lines());
        var claim = idempotency.begin(actor.getId(), "UPDATE_MATERIAL_ADDENDUM", "QUOTE", addendumId, required(key), fingerprint);
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readPlumberAddendum(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found"));
        assigned(order, actor);
        ServiceQuote addendum = quoteForUpdate(addendumId, orderId);
        requireAddendum(addendum);
        if (addendum.getState() != QuoteState.DRAFT) throw conflict("Only a draft addendum may be edited");
        if (request.lines().stream().anyMatch(line -> !Objects.equals(line.materialRequestId(), request.materialRequestId())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All lines must use the requested material request");
        validateBase(orderId, quotes.findByIdForUpdate(addendum.getBaseQuote().getId()).orElseThrow());
        replaceAddendumLines(order, addendum, request.lines(), request.pricingCatalogId(), true, false);
        emitAddendum(addendum, "ADDENDUM_UPDATED", QuoteState.DRAFT, QuoteState.DRAFT, actor, claim.getId(), null, false);
        PlumberMaterialAddendumResponse out = plumberAddendumResponse(addendum);
        idempotency.complete(claim.getId(), json(out));
        return out;
    }

    @Transactional
    public PlumberMaterialAddendumResponse publishAddendum(Long orderId, Long addendumId, Integer expiryHours, String key) {
        User actor = plumber();
        var claim = idempotency.begin(actor.getId(), "PUBLISH_MATERIAL_ADDENDUM", "QUOTE", addendumId, required(key), "addendum:publish:" + addendumId + ":" + expiryHours);
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readPlumberAddendum(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found"));
        assigned(order, actor);
        List<Phase2Reconciliation> liveReconciliations = phase2Authorization.lockLiveReconciliations(orderId);
        boolean reconciliationCorrection = liveReconciliations.size() == 1
                && liveReconciliations.get(0).getStatus() == ReconciliationState.OPEN
                && liveReconciliations.get(0).getCorrectionType() == null;
        ServiceQuote addendum = quoteForUpdate(addendumId, orderId);
        requireAddendum(addendum);
        if (addendum.getState() != QuoteState.DRAFT) throw conflict("Only a draft addendum may be published");
        ServiceQuote base = quotes.findByIdForUpdate(addendum.getBaseQuote().getId()).orElseThrow(() -> notFound("Base quote not found"));
        validateBase(orderId, base);
        List<ServiceQuoteMaterialLink> links = materialLinks.findByQuoteIdForUpdate(addendumId);
        if (links.isEmpty() || links.stream().noneMatch(l -> l.getMaterialItemId() != null)) throw conflict("Addendum requires priced material items");
        validateMaterialRequestAndItems(order, addendum, links, false, reconciliationCorrection);
        List<ServiceQuoteLine> quoteLines = lines.findByQuoteIdOrderByIdAsc(addendumId);
        if (quoteLines.isEmpty()) throw conflict("Addendum requires material lines");
        BigDecimal materialTotal = BigDecimal.ZERO;
        for (ServiceQuoteLine line : quoteLines) {
            if (!"MATERIAL".equals(line.getLineType())) throw conflict("Material addenda may contain only MATERIAL lines");
            if (line.getMaterialItemId() == null || line.getMaterialRequestId() == null) throw conflict("Each addendum line requires a linked material item");
            ServiceQuoteMaterialLink link = materialLinks.findFirstByQuoteIdAndMaterialItemId(addendumId, line.getMaterialItemId()).orElseThrow(() -> conflict("Material line is not linked to this addendum"));
            if (!Objects.equals(link.getMaterialRequestId(), line.getMaterialRequestId())) throw conflict("Material line request ownership mismatch");
            if (addendum.getPricingCatalogId() == null && !"STORE".equals(line.getPricingSource())) throw conflict("Catalog may be omitted only for store-priced material lines");
            materialTotal = materialTotal.add(line.getLineTotal());
        }
        if (addendum.getPricingCatalogId() == null && quoteLines.stream().anyMatch(l -> !"STORE".equals(l.getPricingSource()))) throw conflict("Catalog may be omitted only for store-priced material lines");
        addendum.setLaborSubtotal(BigDecimal.ZERO.setScale(2)); addendum.setKnownMaterialSubtotal(money(materialTotal));
        addendum.setAmount(money(materialTotal)); addendum.setCurrency("INR");
        LocalDateTime now = LocalDateTime.now(); addendum.setPublishedAt(now); addendum.setExpiresAt(now.plusHours(Math.max(1, expiryHours == null ? 24 : expiryHours)));
        addendum.setImmutableSnapshotAt(now);
        if (addendum.getVersion() == 2 && addendum.getSupersedesQuoteId() != null) {
            ServiceQuote old = quotes.findByIdForUpdate(addendum.getSupersedesQuoteId()).orElseThrow(() -> notFound("Prior addendum not found"));
            if (!Objects.equals(old.getBaseQuote().getId(), base.getId()) || old.getQuoteKind() != QuoteKind.MATERIAL_ADDENDUM || old.getVersion() != 1
                    || !Set.of(QuoteState.REJECTED, QuoteState.EXPIRED, QuoteState.CANCELLED).contains(old.getState())
                    || quotes.findBySupersedesQuoteId(old.getId()).stream().noneMatch(child -> Objects.equals(child.getId(), addendumId)))
                throw conflict("Prior addendum is not eligible for correction");
            QuoteState oldState = old.getState(); old.setState(QuoteState.SUPERSEDED); quotes.saveAndFlush(old);
            materialLinks.findByQuoteIdForUpdate(old.getId()).forEach(link -> { if (link.getAuthorizationState() != MaterialAuthorizationState.ACTIVE) link.setAuthorizationState(MaterialAuthorizationState.SUPERSEDED); });
            emitAddendum(old, "ADDENDUM_SUPERSEDED", oldState, QuoteState.SUPERSEDED, actor, claim.getId(), "replacement publication", true);
        }
        addendum.setState(QuoteState.PUBLISHED); addendum = quotes.saveAndFlush(addendum);
        links.forEach(link -> link.setAuthorizationState(MaterialAuthorizationState.PENDING));
        emitAddendum(addendum, "ADDENDUM_PUBLISHED", QuoteState.DRAFT, QuoteState.PUBLISHED, actor, claim.getId(), null, true);
        PlumberMaterialAddendumResponse out = plumberAddendumResponse(addendum);
        idempotency.complete(claim.getId(), json(out));
        return out;
    }

    @Transactional
    public CustomerMaterialAddendumResponse currentAddendum(Long orderId) {
        User actor = customer();
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found"));
        if (!order.getCustomer().getId().equals(actor.getId())) throw new AccessDeniedException("Not authorized");
        ServiceQuote selected = quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(orderId, QuoteKind.MATERIAL_ADDENDUM).stream()
                .filter(q -> q.getState() != QuoteState.DRAFT && q.getState() != QuoteState.SUPERSEDED && q.getState() != QuoteState.CANCELLED).findFirst()
                .orElseThrow(() -> notFound("Current material addendum not found"));
        selected = quoteForUpdate(selected.getId(), orderId);
        selected = expireAddendumIfNeeded(selected, actor);
        return customerAddendumResponse(selected);
    }

    @Transactional(readOnly = true)
    public CustomerMaterialAddendumResponse readCustomerAddendum(Long orderId, Long addendumId) {
        User actor = customer();
        ServiceOrder order = orders.findById(orderId).orElseThrow(() -> notFound("Service order not found"));
        if (!order.getCustomer().getId().equals(actor.getId())) throw new AccessDeniedException("Not authorized");
        ServiceQuote addendum = quotes.findById(addendumId).filter(q -> q.getServiceOrder().getId().equals(orderId))
                .orElseThrow(() -> notFound("Addendum not found"));
        requireAddendum(addendum);
        if (addendum.getState() == QuoteState.DRAFT) throw notFound("Addendum not found");
        return customerAddendumResponse(addendum);
    }

    @Transactional(readOnly = true)
    public List<CustomerMaterialAddendumResponse> customerAddendumHistory(Long orderId) {
        User actor = customer();
        ServiceOrder order = orders.findById(orderId).orElseThrow(() -> notFound("Service order not found"));
        if (!order.getCustomer().getId().equals(actor.getId())) throw new AccessDeniedException("Not authorized");
        return quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(orderId, QuoteKind.MATERIAL_ADDENDUM)
                .stream().filter(q -> q.getState() != QuoteState.DRAFT).map(this::customerAddendumResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminMaterialAddendumHistoryResponse> adminAddendumHistory(Long orderId) {
        User actor = currentUser.require(); if (!isOperator(actor)) throw new AccessDeniedException("Operations access required");
        orders.findById(orderId).orElseThrow(() -> notFound("Service order not found"));
        return quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(orderId, QuoteKind.MATERIAL_ADDENDUM).stream().map(quote -> {
            String terminalEvent = switch (quote.getState()) {
                case APPROVED -> "ADDENDUM_APPROVED";
                case REJECTED -> "ADDENDUM_REJECTED";
                case EXPIRED -> "ADDENDUM_EXPIRED";
                case SUPERSEDED -> "ADDENDUM_SUPERSEDED";
                case CANCELLED -> "ADDENDUM_CANCELLED";
                default -> null;
            };
            LocalDateTime terminal = terminalEvent == null ? null : quoteEvents.findByQuoteIdOrderByCreatedAtAsc(quote.getId()).stream()
                    .filter(event -> terminalEvent.equals(event.getEventType()))
                    .map(ServiceQuoteEvent::getCreatedAt).findFirst().orElse(null);
            List<MaterialAuthorizationHistoryResponse> links = materialLinks.findHistoryDetails(quote.getId()).stream()
                    .map(row -> new MaterialAuthorizationHistoryResponse(((Number) row[3]).longValue(), row[4] == null ? null : ((Number) row[4]).longValue(),
                            (String) row[6], (String) row[7], (BigDecimal) row[8], row[9] == null ? BigDecimal.ZERO : BigDecimal.valueOf(((Number) row[9]).longValue()), (String) row[10])).toList();
            return AdminMaterialAddendumHistoryResponse.from(quote, terminal, links,
                    lines.findByQuoteIdOrderByIdAsc(quote.getId()).stream().map(QuoteLineResponse::from).toList());
        }).toList();
    }

    @Transactional(noRollbackFor = QuoteExpiredException.class)
    public CustomerMaterialAddendumResponse approveAddendum(Long orderId, Long addendumId, String key) {
        return decideAddendum(orderId, addendumId, key, true, null);
    }

    @Transactional(noRollbackFor = QuoteExpiredException.class)
    public CustomerMaterialAddendumResponse rejectAddendum(Long orderId, Long addendumId, QuoteRejectRequest request, String key) {
        return decideAddendum(orderId, addendumId, key, false, request == null ? null : request.reason());
    }

    private CustomerMaterialAddendumResponse decideAddendum(Long orderId, Long addendumId, String key, boolean approve, String reason) {
        User actor = customer();
        var claim = idempotency.begin(actor.getId(), approve ? "APPROVE_MATERIAL_ADDENDUM" : "REJECT_MATERIAL_ADDENDUM", "QUOTE", addendumId, required(key), fingerprint((approve ? "approve:" : "reject:") + addendumId + ":" + reason));
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readCustomerAddendum(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found"));
        if (!order.getCustomer().getId().equals(actor.getId())) throw new AccessDeniedException("Not authorized");
        List<Phase2Reconciliation> liveReconciliations = phase2Authorization.lockLiveReconciliations(orderId);
        Phase2AuthorizationService.AuthorizationSnapshot beforeApproval = approve && liveReconciliations.size() == 1
                ? phase2Authorization.recalculate(order, null, false) : null;
        ServiceQuote addendum = quoteForUpdate(addendumId, orderId); requireAddendum(addendum);
        ServiceQuote base = quotes.findByIdForUpdate(addendum.getBaseQuote().getId()).orElseThrow(() -> notFound("Base quote not found"));
        validateBase(orderId, base);
        addendum = expireAddendumIfNeeded(addendum, actor);
        if (addendum.getState() == QuoteState.EXPIRED) throw new QuoteExpiredException();
        if (addendum.getState() != QuoteState.PUBLISHED || !isCurrentAddendum(orderId, addendum)) throw conflict("Addendum is not the current published version");
        List<ServiceQuoteMaterialLink> links = materialLinks.findByQuoteIdForUpdate(addendumId);
        boolean reconciliationCorrection = approve && beforeApproval != null
                && liveReconciliations.get(0).getStatus() == ReconciliationState.OPEN
                && liveReconciliations.get(0).getCorrectionType() == null
                && phase2Authorization.isEnrolled(orderId);
        validateMaterialRequestAndItems(order, addendum, links, true, reconciliationCorrection);
        QuoteState from = addendum.getState();
        addendum.setState(approve ? QuoteState.APPROVED : QuoteState.REJECTED); addendum.setDecisionActorId(actor.getId()); addendum.setDecisionReason(reason);
        if (approve) addendum.setApprovedAt(LocalDateTime.now()); else addendum.setRejectedAt(LocalDateTime.now());
        addendum = quotes.saveAndFlush(addendum);
        links.forEach(link -> link.setAuthorizationState(approve ? MaterialAuthorizationState.ACTIVE : MaterialAuthorizationState.REJECTED));
        materialLinks.saveAll(links);
        if (reconciliationCorrection)
            phase2Authorization.applyApprovedMaterialCorrection(order, addendum, liveReconciliations, beforeApproval);
        emitAddendum(addendum, approve ? "ADDENDUM_APPROVED" : "ADDENDUM_REJECTED", from, addendum.getState(), actor, claim.getId(), reason, true);
        CustomerMaterialAddendumResponse out = customerAddendumResponse(addendum);
        idempotency.complete(claim.getId(), json(out));
        return out;
    }


    private ServiceQuote quoteForRead(Long id, Long orderId) { ServiceQuote q = quotes.findById(id).orElseThrow(() -> notFound("Quote not found")); if (!q.getServiceOrder().getId().equals(orderId)) throw notFound("Quote not found"); return q; }
    private boolean isOperator(User u) { return u.getRole() == Role.ADMIN || u.getRole() == Role.SUPER_ADMIN || u.getRole() == Role.OPERATIONS_ADMIN; }

    @Transactional
    public PlumberQuoteResponse publish(Long orderId, Long quoteId, QuotePublishRequest request, String key) {
        User actor = plumber();
        var claim = idempotency.begin(actor.getId(), "PUBLISH_QUOTE", "QUOTE", quoteId, required(key), "publish:" + quoteId + ":" + (request == null ? "" : request.pricingCatalogId()));
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readPlumber(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found")); assigned(order, actor);
        ServiceQuote quote = quoteForUpdate(quoteId, orderId);
        if (quote.getState() != QuoteState.DRAFT) throw conflict("Quote is not a draft");
        if (quote.getQuoteKind() == QuoteKind.REVISION) {
            ServiceQuote original = quote.getSupersedesQuoteId() == null ? null
                    : quotes.findByIdForUpdate(quote.getSupersedesQuoteId()).orElse(null);
            if (original == null || (original.getState() != QuoteState.PUBLISHED && original.getState() != QuoteState.REJECTED)
                    || original.getExpiresAt() == null || !LocalDateTime.now().isBefore(original.getExpiresAt())
                    || !isCurrent(orderId, original)) {
                throw conflict("The original quote is no longer current and publishable");
            }
        }
        if (quote.getDiagnosis() == null || quote.getDiagnosis().getState() != DiagnosisState.SUBMITTED) throw conflict("A submitted diagnosis is required");
        ServicePricingCatalog catalog = selectCatalog(request == null ? null : request.pricingCatalogId());
        List<ServicePricingCatalogLine> catalogEntries = catalogLines.findByPricingCatalogId(catalog.getId());
        if (catalogEntries.isEmpty()) throw conflict("Pricing catalog has no lines");
        lines.deleteAll(lines.findByQuoteIdOrderByIdAsc(quoteId));
        BigDecimal laborUnits = Optional.ofNullable(quote.getDiagnosis().getEstimatedLaborUnits()).orElse(BigDecimal.ONE);
        ServicePricingCatalogLine labor = catalogEntries.stream().filter(x -> "LABOR".equals(x.getLineType())).findFirst().orElseThrow(() -> conflict("Pricing catalog has no labor price"));
        laborUnits = validatedQuantity(laborUnits);
        validateCatalogQuantity(labor, laborUnits);
        BigDecimal laborTotal = labor.getAmount().multiply(laborUnits).setScale(2, RoundingMode.HALF_UP);
        ServiceQuoteLine line = lines.save(ServiceQuoteLine.builder().quote(quote).lineType("LABOR").description(labor.getLineKey()).amount(laborTotal).pricingSource("CATALOG").pricingCatalogLineId(labor.getId()).quantity(laborUnits).unit(labor.getUnit().trim()).unitPrice(labor.getAmount()).lineTotal(laborTotal).pricingSourceVersion(catalog.getVersion()).build());
        quote.setLaborSubtotal(laborTotal); quote.setKnownMaterialSubtotal(BigDecimal.ZERO); quote.setAmount(laborTotal); quote.setCurrency(catalog.getCurrency()); quote.setPricingCatalogId(catalog.getId()); quote.setPricingCatalogVersion(catalog.getVersion());
        LocalDateTime now = LocalDateTime.now(); quote.setPublishedAt(now); quote.setExpiresAt(now.plusHours(request == null || request.expiryHours() == null ? 24 : Math.max(1, request.expiryHours()))); quote.setImmutableSnapshotAt(now);
        if (quote.getSupersedesQuoteId() != null) {
            ServiceQuote old = quotes.findByIdForUpdate(quote.getSupersedesQuoteId()).orElseThrow();
            if (old.getState() == QuoteState.PUBLISHED || old.getState() == QuoteState.REJECTED) {
                QuoteState oldState = old.getState();
                old.setState(QuoteState.SUPERSEDED); quotes.saveAndFlush(old);
                emit(old, "QUOTE_SUPERSEDED", oldState, QuoteState.SUPERSEDED, actor, claim.getId(), "revision");
            }
        }
        quote.setState(QuoteState.PUBLISHED); quote = quotes.saveAndFlush(quote);
        emit(quote, "QUOTE_PUBLISHED", QuoteState.DRAFT, QuoteState.PUBLISHED, actor, claim.getId(), null);
        PlumberQuoteResponse out = plumberResponse(quote); idempotency.complete(claim.getId(), json(out)); return out;
    }

    @Transactional
    public PlumberQuoteResponse revise(Long orderId, Long quoteId, QuoteRevisionRequest request, String key) {
        User actor = plumber(); var claim = idempotency.begin(actor.getId(), "CREATE_QUOTE_REVISION", "QUOTE", quoteId, required(key), "revision:" + quoteId + ":" + (request == null ? "" : request.reason()));
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readPlumber(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found")); assigned(order, actor); ServiceQuote source = quoteForUpdate(quoteId, orderId);
        if (source.getQuoteKind() != QuoteKind.INITIAL || (source.getState() != QuoteState.PUBLISHED && source.getState() != QuoteState.REJECTED)
                || source.getExpiresAt() == null || !LocalDateTime.now().isBefore(source.getExpiresAt())
                || !isCurrent(orderId, source)
                || quotes.findVersions(orderId, QuoteKind.REVISION).stream().findAny().isPresent()) throw conflict("Quote cannot be revised");
        ServiceQuote revision = quotes.saveAndFlush(ServiceQuote.builder().serviceOrder(order).diagnosis(source.getDiagnosis())
                .quoteKind(QuoteKind.REVISION).version(2).state(QuoteState.DRAFT).amount(BigDecimal.ZERO)
                .laborSubtotal(BigDecimal.ZERO).knownMaterialSubtotal(BigDecimal.ZERO).currency("INR")
                .supersedesQuote(source).supersedesQuoteId(source.getId()).baseQuote(source).build());
        PlumberQuoteResponse out = plumberResponse(revision); idempotency.complete(claim.getId(), json(out)); return out;
    }

    @Transactional
    public CustomerQuoteResponse current(Long orderId) { User actor = currentUser.require(); ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found")); if (actor.getRole() != Role.CUSTOMER || !order.getCustomer().getId().equals(actor.getId())) throw new AccessDeniedException("Not authorized"); ServiceQuote selected = quotes.findByServiceOrderIdOrderByVersionDesc(orderId).stream().filter(x -> x.getState() != QuoteState.DRAFT && x.getState() != QuoteState.SUPERSEDED && x.getState() != QuoteState.CANCELLED).findFirst().orElseThrow(() -> notFound("Current quote not found")); ServiceQuote q = quoteForUpdate(selected.getId(), orderId); return customerResponse(expireIfNeeded(q)); }

    @Transactional(noRollbackFor = QuoteExpiredException.class)
    public CustomerQuoteResponse approve(Long orderId, Long quoteId, String key) { return decide(orderId, quoteId, key, true, null); }
    @Transactional(noRollbackFor = QuoteExpiredException.class)
    public CustomerQuoteResponse reject(Long orderId, Long quoteId, QuoteRejectRequest request, String key) { return decide(orderId, quoteId, key, false, request == null ? null : request.reason()); }

    private CustomerQuoteResponse decide(Long orderId, Long quoteId, String key, boolean approve, String reason) {
        User actor = customer(); var claim = idempotency.begin(actor.getId(), approve ? "APPROVE_QUOTE" : "REJECT_QUOTE", "QUOTE", quoteId, required(key), (approve ? "approve:" : "reject:") + quoteId + ":" + reason);
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return readCustomer(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found")); if (!order.getCustomer().getId().equals(actor.getId())) throw new AccessDeniedException("Not authorized"); ServiceQuote q = quoteForUpdate(quoteId, orderId); q = expireIfNeeded(q);
        if (q.getState() == QuoteState.EXPIRED) throw new QuoteExpiredException();
        if (q.getState() != QuoteState.PUBLISHED) throw conflict("Quote is not currently publishable"); if (!isCurrent(orderId, q)) throw conflict("Quote is not current");
        QuoteState from = q.getState(); q.setState(approve ? QuoteState.APPROVED : QuoteState.REJECTED); q.setDecisionActorId(actor.getId()); q.setDecisionReason(reason); if (approve) q.setApprovedAt(LocalDateTime.now()); else q.setRejectedAt(LocalDateTime.now()); q = quotes.saveAndFlush(q); emit(q, approve ? "QUOTE_APPROVED" : "QUOTE_REJECTED", from, q.getState(), actor, claim.getId(), reason); CustomerQuoteResponse out = customerResponse(q); idempotency.complete(claim.getId(), json(out)); return out;
    }

    private ServiceQuote expireIfNeeded(ServiceQuote q) { if (q.getState() == QuoteState.PUBLISHED && q.getExpiresAt() != null && !LocalDateTime.now().isBefore(q.getExpiresAt())) { q.setState(QuoteState.EXPIRED); q = quotes.saveAndFlush(q); User actor = currentUser.require(); emit(q, "QUOTE_EXPIRED", QuoteState.PUBLISHED, QuoteState.EXPIRED, actor, null, "expiry"); } return q; }
    private boolean isCurrent(Long orderId, ServiceQuote q) {
        ServiceQuote current = quotes.findFirstByServiceOrderIdAndQuoteKindAndState(orderId, q.getQuoteKind(), QuoteState.PUBLISHED).orElse(null);
        if (current != null) return current.getId().equals(q.getId());
        if (q.getQuoteKind() != QuoteKind.INITIAL) return false;
        return quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(orderId, QuoteKind.REVISION).stream().noneMatch(revision ->
                revision.getState() != QuoteState.CANCELLED && revision.getState() != QuoteState.DRAFT);
    }
    private ServicePricingCatalog selectCatalog(Long id) {
        LocalDateTime now = LocalDateTime.now();
        if (id != null) return catalogs.findById(id)
                .filter(c -> "ACTIVE".equals(c.getStatus()) && "INR".equals(c.getCurrency())
                        && !c.getEffectiveFrom().isAfter(now)
                        && (c.getEffectiveTo() == null || c.getEffectiveTo().isAfter(now)))
                .orElseThrow(() -> conflict("Pricing catalog is not active"));
        return catalogs.findCurrentActive("INR").stream().findFirst().orElseThrow(() -> conflict("No active pricing catalog"));
    }
    private BigDecimal validatedQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0 || quantity.stripTrailingZeros().scale() > 2
                || quantity.precision() - quantity.scale() > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive and use at most two decimal places");
        }
        return quantity.setScale(2, RoundingMode.UNNECESSARY);
    }
    private void validateCatalogQuantity(ServicePricingCatalogLine line, BigDecimal quantity) {
        if (line.getUnit() == null || line.getUnit().isBlank() || line.getMinQuantity() == null || line.getMaxQuantity() == null) {
            throw conflict("Pricing catalog line requires configured unit and quantity bounds");
        }
        if (line.getMinQuantity().signum() <= 0 || line.getMaxQuantity().compareTo(line.getMinQuantity()) < 0) {
            throw conflict("Pricing catalog line has invalid quantity bounds");
        }
        if (quantity.compareTo(line.getMinQuantity()) < 0 || quantity.compareTo(line.getMaxQuantity()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity is outside the pricing catalog line bounds");
        }
    }
    private ServiceQuote quoteForUpdate(Long id, Long orderId) { ServiceQuote q = quotes.findByIdForUpdate(id).orElseThrow(() -> notFound("Quote not found")); if (!q.getServiceOrder().getId().equals(orderId)) throw notFound("Quote not found"); return q; }
    private void assigned(ServiceOrder o, User u) { if (o.getPlumber() == null || !o.getPlumber().getId().equals(u.getId())) throw new AccessDeniedException("Only the assigned plumber may manage quotes"); }
    private User plumber() { User u = currentUser.require(); if (u.getRole() != Role.PLUMBER) throw new AccessDeniedException("Plumber access required"); return u; }
    private User customer() { User u = currentUser.require(); if (u.getRole() != Role.CUSTOMER) throw new AccessDeniedException("Customer access required"); return u; }
    private String required(String key) { if (key == null || key.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key is required"); return key; }
    private String fingerprint(String source) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256").digest(source.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException("SHA-256 is unavailable", e); }
    }
    private ResponseStatusException conflict(String s) { return new ResponseStatusException(HttpStatus.CONFLICT, s); }
    private ResponseStatusException notFound(String s) { return new ResponseStatusException(HttpStatus.NOT_FOUND, s); }
    private PlumberQuoteResponse plumberResponse(ServiceQuote q) { return PlumberQuoteResponse.from(q, lines.findByQuoteIdOrderByIdAsc(q.getId()).stream().map(QuoteLineResponse::from).toList()); }
    private CustomerQuoteResponse customerResponse(ServiceQuote q) { return CustomerQuoteResponse.from(q, lines.findByQuoteIdOrderByIdAsc(q.getId()).stream().map(QuoteLineResponse::from).toList()); }
    private PlumberQuoteResponse readPlumber(String s) { try { return mapper.readValue(s, PlumberQuoteResponse.class); } catch (Exception e) { throw new IllegalStateException(e); } }
    private CustomerQuoteResponse readCustomer(String s) { try { return mapper.readValue(s, CustomerQuoteResponse.class); } catch (Exception e) { throw new IllegalStateException(e); } }
    private String json(Object o) { try { return mapper.writeValueAsString(o); } catch (Exception e) { throw new IllegalStateException(e); } }
    private void emit(ServiceQuote q, String type, QuoteState from, QuoteState to, User actor, Long idem, String reason) { events.record(ServiceQuoteEvent.builder().serviceOrderId(q.getServiceOrder().getId()).diagnosisId(q.getDiagnosis() == null ? null : q.getDiagnosis().getId()).quoteId(q.getId()).aggregateType("QUOTE").aggregateId(q.getId()).transitionKey(type + ":" + q.getId()).eventType(type).fromState(from == null ? null : from.name()).toState(to.name()).actorId(actor.getId()).actorRole(actor.getRole().name()).reason(reason).idempotencyKeyId(idem).build(), "phase2.quote", type); }
}
