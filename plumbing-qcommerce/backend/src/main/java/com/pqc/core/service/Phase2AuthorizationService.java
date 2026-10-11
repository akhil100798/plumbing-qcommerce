package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Narrow Phase 2 repair-authorization and reconciliation boundary. */
@Service
@RequiredArgsConstructor
public class Phase2AuthorizationService {
    private static final Set<ReconciliationState> LIVE_RECONCILIATIONS =
            Set.of(ReconciliationState.OPEN, ReconciliationState.AWAITING_CUSTOMER_APPROVAL);

    private final Phase2EnrollmentRepository enrollments;
    private final ServiceDiagnosisRepository diagnoses;
    private final ServiceQuoteRepository quotes;
    private final ServiceQuoteLineRepository lines;
    private final ServiceQuoteMaterialLinkRepository materialLinks;
    private final Phase2ReconciliationRepository reconciliations;
    private final LegacyBillingPreviewService billing;
    private final ProductOrderRepository materialRequests;

    @Transactional(noRollbackFor = Phase2ReconciliationRequiredException.class)
    public AuthorizationSnapshot requireResumeAuthorization(ServiceOrder order) {
        if (!enrolled(order.getId())) return null;
        List<Phase2Reconciliation> live = reconciliations.findOpenForUpdate(order.getId(), LIVE_RECONCILIATIONS);
        AuthorizationSnapshot snapshot = recalculate(order, null, true);
        if (!snapshot.materialAuthorized()) throw conflict("Phase 2 repair authorization is incomplete");
        if (!live.isEmpty()) throw conflict("Phase 2 reconciliation must be resolved before resuming work");
        return snapshot;
    }

    @Transactional(noRollbackFor = Phase2ReconciliationRequiredException.class)
    public AuthorizationSnapshot requireCompletionAuthorization(ServiceOrder order, BigDecimal suppliedExtraCharge) {
        if (!enrolled(order.getId())) return null;
        reconciliations.findOpenForUpdate(order.getId(), LIVE_RECONCILIATIONS);
        AuthorizationSnapshot snapshot = recalculate(order, suppliedExtraCharge, true);
        if (!snapshot.materialAuthorized()) throw conflict("Phase 2 repair authorization is incomplete");
        if (snapshot.varianceAmount().signum() > 0) {
            openReconciliation(order, snapshot, order.getPlumber() == null ? null : order.getPlumber().getId());
            throw new Phase2ReconciliationRequiredException("Repair amount exceeds customer authorization; reconciliation required");
        }
        validateCoveredReconciliation(order.getId(), snapshot);
        return snapshot;
    }

    /** Called after the order is locked; can be used for read-only operations projection. */
    @Transactional
    public AuthorizationSnapshot recalculate(ServiceOrder order, BigDecimal approvedRepairScopeExtra,
                                             boolean lockPhase2Rows) {
        if (!enrolled(order.getId())) return null;
        List<ServiceDiagnosis> diagnosisRows = lockPhase2Rows
                ? diagnoses.findByServiceOrderIdForUpdate(order.getId())
                : diagnoses.findByServiceOrderId(order.getId());
        Optional<ServiceDiagnosis> currentDiagnosis = diagnosisRows.stream()
                .filter(d -> d.getState() == DiagnosisState.SUBMITTED)
                .max(Comparator.comparing(ServiceDiagnosis::getVersionNumber));
        if (currentDiagnosis.isEmpty()) throw conflict("A submitted Phase 2 diagnosis is required");
        if (currentDiagnosis.get().isSafetyBlocked()) throw conflict("Diagnosis contains a safety block");

        List<ServiceQuote> quoteRows = lockPhase2Rows
                ? quotes.findByServiceOrderIdForUpdate(order.getId())
                : quotes.findByServiceOrderIdOrderByVersionAsc(order.getId());
        Set<Long> supersededAddenda = quoteRows.stream().filter(q -> q.getQuoteKind() == QuoteKind.MATERIAL_ADDENDUM)
                .map(ServiceQuote::getSupersedesQuoteId).filter(Objects::nonNull).collect(Collectors.toSet());
        List<ServiceQuote> materialAddenda = quoteRows.stream()
                .filter(q -> q.getQuoteKind() == QuoteKind.MATERIAL_ADDENDUM)
                .filter(q -> !supersededAddenda.contains(q.getId()))
                .toList();
        ServiceQuote base = quoteRows.stream()
                .filter(q -> q.getQuoteKind() == QuoteKind.INITIAL || q.getQuoteKind() == QuoteKind.REVISION)
                .filter(q -> q.getState() == QuoteState.APPROVED && q.getApprovedAt() != null)
                .filter(q -> q.getDiagnosis() != null && q.getDiagnosis().getId().equals(currentDiagnosis.get().getId()))
                .max(Comparator.comparing(ServiceQuote::getVersion)).orElse(null);
        if (base == null) throw conflict("An approved current repair quote is required");

        BigDecimal authorized = money(base.getAmount());
        BigDecimal authorizedMaterials = money(base.getKnownMaterialSubtotal());
        BigDecimal approvedExtraScope = BigDecimal.ZERO;
        boolean materialsAuthorized = true;
        for (ServiceQuote addendum : materialAddenda) {
            List<ServiceQuoteMaterialLink> links = lockPhase2Rows
                    ? materialLinks.findByQuoteIdForUpdate(addendum.getId())
                    : materialLinks.findByQuoteIdOrderByIdAsc(addendum.getId());
            boolean required = links.stream().anyMatch(link -> "MATERIAL".equals(link.getLinkType()));
            boolean currentForMaterial = addendum.getBaseQuote() != null
                    && addendum.getBaseQuote().getId().equals(base.getId());
            if (!required || !currentForMaterial) continue;
            if (addendum.getState() == QuoteState.APPROVED && addendum.getApprovedAt() != null) {
                authorized = authorized.add(money(addendum.getAmount()));
                authorizedMaterials = authorizedMaterials.add(money(addendum.getKnownMaterialSubtotal()));
                if (links.stream().filter(l -> "MATERIAL".equals(l.getLinkType()))
                        .anyMatch(l -> l.getAuthorizationState() != MaterialAuthorizationState.ACTIVE)) {
                    materialsAuthorized = false;
                }
            } else {
                materialsAuthorized = false;
            }
        }
        BigDecimal suppliedExtra = money(approvedRepairScopeExtra);
        if (suppliedExtra.signum() != 0 && suppliedExtra.compareTo(approvedExtraScope) != 0)
            throw conflict("Extra charge is not represented by customer-approved repair scope");
        LegacyBillingPreviewService.Preview preview = billing.preview(order.getId(), suppliedExtra, LocalDateTime.now());
        BigDecimal legacyRepair = preview.legacyRepairAmount();
        BigDecimal variance = legacyRepair.subtract(authorized).setScale(2, RoundingMode.HALF_UP);
        BigDecimal materialVariance = preview.components().deliveredPartsTotal().subtract(authorizedMaterials)
                .setScale(2, RoundingMode.HALF_UP);
        return new AuthorizationSnapshot(authorized, authorizedMaterials, legacyRepair, variance, materialVariance,
                materialsAuthorized, base.getId(), preview.components());
    }

    /** Lock the current reconciliation directly after the service order, before quote locks are taken. */
    @Transactional
    public List<Phase2Reconciliation> lockLiveReconciliations(Long orderId) {
        return reconciliations.findOpenForUpdate(orderId, LIVE_RECONCILIATIONS);
    }

    /** Attach a valid customer-approved material correction and refresh this attempt once. */
    @Transactional
    public void applyApprovedMaterialCorrection(ServiceOrder order, ServiceQuote addendum,
                                                List<Phase2Reconciliation> liveRows,
                                                AuthorizationSnapshot beforeApproval) {
        if (liveRows == null || liveRows.size() != 1 || beforeApproval == null) return;
        Phase2Reconciliation row = liveRows.get(0);
        if (row.getStatus() != ReconciliationState.OPEN || row.getCorrectionType() != null
                || row.getCorrectionQuoteId() != null || row.getCorrectionAddendumId() != null
                || addendum.getState() != QuoteState.APPROVED || addendum.getApprovedAt() == null
                || addendum.getQuoteKind() != QuoteKind.MATERIAL_ADDENDUM
                || addendum.getBaseQuote() == null
                || !Objects.equals(addendum.getBaseQuote().getId(), beforeApproval.approvedBaseQuoteId())
                || !validMaterialCorrectionLines(addendum.getId(), order.getId())) return;

        if (enrollments.findByServiceOrderId(order.getId()).isEmpty()) return;
        BigDecimal materialGap = beforeApproval.materialVarianceAmount();
        BigDecimal correctionAmount = money(addendum.getKnownMaterialSubtotal());
        if (materialGap.signum() <= 0 || correctionAmount.signum() <= 0
                || correctionAmount.compareTo(materialGap) > 0)
            return;

        AuthorizationSnapshot afterApproval = recalculate(order, null, false);
        if (!afterApproval.materialAuthorized()) return;

        row.setCorrectionType("MATERIAL_ADDENDUM");
        row.setCorrectionAddendumId(addendum.getId());
        row.setAuthorizedRepairAmount(afterApproval.authorizedRepairAmount());
        row.setLegacyRepairAmount(afterApproval.legacyRepairAmount());
        row.setVarianceAmount(afterApproval.varianceAmount());
        row.setResolution("Customer-approved material addendum linked; reconciliation recalculated");
        if (afterApproval.varianceAmount().signum() <= 0) {
            row.setStatus(ReconciliationState.RESOLVED);
            row.setResolvedAt(LocalDateTime.now());
            row.setResolution("Customer-approved material correction covers current repair amount");
        }
        reconciliations.save(row);
    }

    @Transactional
    public void reconcileSuccessfulCompletion(ServiceOrder order, AuthorizationSnapshot snapshot) {
        if (snapshot == null) return;
        List<Phase2Reconciliation> live = reconciliations.findOpenForUpdate(order.getId(), LIVE_RECONCILIATIONS);
        boolean correctionSnapshotAlreadyRecorded = reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                .anyMatch(row -> row.getStatus() == ReconciliationState.RESOLVED
                        && "MATERIAL_ADDENDUM".equals(row.getCorrectionType())
                        && row.getAuthorizedRepairAmount().compareTo(snapshot.authorizedRepairAmount()) == 0
                        && row.getLegacyRepairAmount().compareTo(snapshot.legacyRepairAmount()) == 0
                        && row.getVarianceAmount().compareTo(snapshot.varianceAmount()) == 0);
        if (!live.isEmpty())
            throw conflict("Customer-approved correction did not cover the reconciliation snapshot; close or cancel the order");
        if (snapshot.varianceAmount().signum() < 0 && live.isEmpty() && !correctionSnapshotAlreadyRecorded) {
            Phase2Reconciliation lowerVariance = Phase2Reconciliation.builder()
                    .serviceOrderId(order.getId())
                    .authorizedRepairAmount(snapshot.authorizedRepairAmount())
                    .legacyRepairAmount(snapshot.legacyRepairAmount())
                    .varianceAmount(snapshot.varianceAmount())
                    .status(ReconciliationState.RESOLVED)
                    .reason("Actual legacy repair amount was lower than customer authorization")
                    .createdBy(order.getPlumber() == null ? order.getCustomer().getId() : order.getPlumber().getId())
                    .resolvedAt(LocalDateTime.now())
                    .resolution("Completed using the lower actual legacy amount; no refund or credit created")
                    .build();
            reconciliations.save(lowerVariance);
        }
    }

    @Transactional
    public void closeReconciliationForCancellation(Long serviceOrderId) {
        for (Phase2Reconciliation row : reconciliations.findOpenForUpdate(serviceOrderId, LIVE_RECONCILIATIONS)) {
            row.setStatus(ReconciliationState.CLOSED_CANCELLED);
            row.setResolvedAt(LocalDateTime.now());
            row.setCorrectionType("CANCEL");
            row.setCorrectionQuoteId(null);
            row.setCorrectionAddendumId(null);
            row.setResolution("Service order cancelled");
            reconciliations.save(row);
        }
    }

    @Transactional(readOnly = true)
    public List<Phase2Reconciliation> history(Long serviceOrderId) {
        return reconciliations.findByServiceOrderIdOrderByCreatedAtDesc(serviceOrderId);
    }

    private boolean enrolled(Long orderId) {
        return enrollments.findByServiceOrderId(orderId).isPresent();
    }

    public boolean isEnrolled(Long orderId) {
        return enrolled(orderId);
    }

    private void validateCoveredReconciliation(Long orderId, AuthorizationSnapshot snapshot) {
        if (!snapshot.materialAuthorized() || snapshot.varianceAmount().signum() > 0) return;
        if (!reconciliations.findOpenForUpdate(orderId, LIVE_RECONCILIATIONS).isEmpty())
            throw conflict("Customer-approved correction did not cover the reconciliation snapshot; close or cancel the order");
    }

    private Phase2Reconciliation openReconciliation(ServiceOrder order, AuthorizationSnapshot snapshot, Long actorId) {
        List<Phase2Reconciliation> live = reconciliations.findOpenForUpdate(order.getId(), LIVE_RECONCILIATIONS);
        if (!live.isEmpty()) {
            return live.get(0); // Attempt snapshots remain immutable across retries.
        }
        Phase2Reconciliation row = Phase2Reconciliation.builder().serviceOrderId(order.getId())
                .authorizedRepairAmount(snapshot.authorizedRepairAmount()).legacyRepairAmount(snapshot.legacyRepairAmount())
                .varianceAmount(snapshot.varianceAmount()).status(ReconciliationState.OPEN)
                .reason("Legacy repair amount exceeds customer-approved repair authorization")
                .createdBy(actorId == null ? order.getCustomer().getId() : actorId).build();
        return reconciliations.save(row);
    }

    private boolean validApprovedCorrection(Long orderId, Phase2Reconciliation row, AuthorizationSnapshot snapshot) {
        if ("REVISION".equals(row.getCorrectionType())) {
            return row.getCorrectionQuoteId() != null && row.getCorrectionAddendumId() == null
                    && Objects.equals(row.getCorrectionQuoteId(), snapshot.approvedBaseQuoteId())
                    && quotes.findById(row.getCorrectionQuoteId()).filter(q ->
                    q.getServiceOrder().getId().equals(orderId) && q.getQuoteKind() == QuoteKind.REVISION
                            && q.getState() == QuoteState.APPROVED && q.getApprovedAt() != null).isPresent();
        }
        if ("MATERIAL_ADDENDUM".equals(row.getCorrectionType())) {
            return row.getCorrectionAddendumId() != null && row.getCorrectionQuoteId() == null
                    && quotes.findById(row.getCorrectionAddendumId()).filter(q ->
                    q.getServiceOrder().getId().equals(orderId) && q.getQuoteKind() == QuoteKind.MATERIAL_ADDENDUM
                    && q.getState() == QuoteState.APPROVED && q.getApprovedAt() != null
                    && q.getBaseQuote() != null && q.getBaseQuote().getState() == QuoteState.APPROVED
                             && Objects.equals(q.getBaseQuote().getId(), snapshot.approvedBaseQuoteId())
                             && quotes.findByServiceOrderIdAndBaseQuoteIdAndQuoteKindOrderByVersionDesc(
                                     orderId, q.getBaseQuote().getId(), QuoteKind.MATERIAL_ADDENDUM).stream()
                                     .findFirst().map(current -> Objects.equals(current.getId(), q.getId())).orElse(false)
                             && validMaterialCorrectionLines(q.getId(), orderId))
                    .isPresent();
        }
        return false;
    }

    private boolean validMaterialCorrectionLines(Long quoteId, Long orderId) {
        List<ServiceQuoteLine> correctionLines = lines.findByQuoteIdOrderByIdAsc(quoteId);
        List<ServiceQuoteMaterialLink> correctionLinks = materialLinks.findByQuoteIdOrderByIdAsc(quoteId);
        return !correctionLines.isEmpty() && !correctionLinks.isEmpty()
                && correctionLines.stream().allMatch(line -> "MATERIAL".equals(line.getLineType())
                    && line.getMaterialItemId() != null && line.getMaterialRequestId() != null
                    && correctionLinks.stream().anyMatch(link -> Objects.equals(link.getMaterialItemId(), line.getMaterialItemId())
                        && Objects.equals(link.getMaterialRequestId(), line.getMaterialRequestId())
                        && Objects.equals(link.getServiceOrderId(), orderId) && Objects.equals(link.getQuoteId(), quoteId)
                        && link.getAuthorizationState() == MaterialAuthorizationState.ACTIVE))
                && correctionLinks.stream().allMatch(link -> "MATERIAL".equals(link.getLinkType())
                    && Objects.equals(link.getServiceOrderId(), orderId) && Objects.equals(link.getQuoteId(), quoteId)
                    && materialRequests.findById(link.getMaterialRequestId())
                            .map(request -> request.getServiceOrder() != null
                                    && Objects.equals(request.getServiceOrder().getId(), orderId)
                                    && request.getStatus() == ProductOrderStatus.DELIVERED)
                            .orElse(false));
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    public record AuthorizationSnapshot(BigDecimal authorizedRepairAmount, BigDecimal authorizedMaterialAmount,
                                         BigDecimal legacyRepairAmount, BigDecimal varianceAmount,
                                         BigDecimal materialVarianceAmount, boolean materialAuthorized,
                                         Long approvedBaseQuoteId, LegacyBillingResult billingResult) { }
}
