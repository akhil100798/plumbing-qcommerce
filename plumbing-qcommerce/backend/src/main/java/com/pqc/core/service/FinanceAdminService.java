package com.pqc.core.service;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceAdminService {
    private static final BigDecimal STORE_COMMISSION_RATE = new BigDecimal("0.10");
    private static final BigDecimal PLUMBER_COMMISSION_RATE = new BigDecimal("0.10");
    private static final BigDecimal DELIVERY_COMMISSION_RATE = new BigDecimal("0.05");

    private final ProductOrderRepository productOrderRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final SettlementRepository settlementRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public FinanceDashboardResponse getDashboard() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        BigDecimal productRevenue = safe(productOrderRepository.sumTotalAmountByStatus(ProductOrderStatus.DELIVERED));
        BigDecimal serviceRevenue = safe(serviceOrderRepository.sumCompletedOrdersRevenue()).add(sumPaidServiceRevenue());
        BigDecimal totalRevenue = productRevenue.add(serviceRevenue);
        BigDecimal todayRevenue = sumProductRevenueBetween(start, end).add(sumServiceRevenueBetween(start, end));
        long successfulPayments = productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.CONFIRMED, ProductOrderStatus.PACKING, ProductOrderStatus.READY_FOR_PICKUP, ProductOrderStatus.OUT_FOR_DELIVERY, ProductOrderStatus.DELIVERED))
                + serviceOrderRepository.countByStatus(OrderStatus.PAID);
        long failedPayments = productOrderRepository.countByStatusIn(List.of(ProductOrderStatus.FAILED, ProductOrderStatus.CANCELLED));
        long pendingPayments = productOrderRepository.countByStatus(ProductOrderStatus.PENDING);
        return new FinanceDashboardResponse(
                totalRevenue,
                todayRevenue,
                successfulPayments + failedPayments + pendingPayments,
                successfulPayments,
                failedPayments,
                pendingPayments,
                refundRequestRepository.count(),
                refundRequestRepository.countByStatus(RefundStatus.PENDING),
                settlementRepository.countByBeneficiaryType(BeneficiaryType.STORE),
                settlementRepository.countByBeneficiaryTypeAndStatus(BeneficiaryType.STORE, SettlementStatus.PENDING),
                settlementRepository.countByBeneficiaryType(BeneficiaryType.PLUMBER),
                settlementRepository.countByBeneficiaryTypeAndStatus(BeneficiaryType.PLUMBER, SettlementStatus.PENDING),
                settlementRepository.countByBeneficiaryType(BeneficiaryType.DELIVERY_PARTNER),
                settlementRepository.countByBeneficiaryTypeAndStatus(BeneficiaryType.DELIVERY_PARTNER, SettlementStatus.PENDING),
                commission(totalRevenue, STORE_COMMISSION_RATE),
                walletRepository.findAll().stream().map(Wallet::getBalance).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add)
        );
    }

    public Page<FinancePaymentSummary> listPayments(String status, String paymentMethod, String search, LocalDate fromDate, LocalDate toDate, int page, int size) {
        return productOrderRepository.findAll(productPaymentSpec(status, search, fromDate, toDate), pageable(page, size)).map(this::toPaymentSummary);
    }

    public FinancePaymentDetail getPayment(String paymentId) {
        Long orderId = parsePaymentId(paymentId);
        ProductOrder order = productOrderRepository.findById(orderId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        User customer = order.getCustomer();
        return new FinancePaymentDetail(
                paymentId(order), order.getId(), "PRODUCT_ORDER", name(customer), phone(customer), email(customer), order.getTotalAmount(), paymentStatus(order.getStatus()), "UNKNOWN", "UNKNOWN", paymentStatus(order.getStatus()), failureReason(order.getStatus()), order.getCreatedAt(), null
        );
    }

    public Page<StoreSettlementSummary> listStoreSettlements(SettlementStatus status, Long storeId, LocalDate fromDate, LocalDate toDate, int page, int size) {
        return settlementRepository.findAll(settlementSpec(BeneficiaryType.STORE, status, storeId, fromDate, toDate), pageable(page, size)).map(this::toStoreSettlement);
    }

    public Page<PlumberPayoutSummary> listPlumberPayouts(int page, int size) {
        return settlementRepository.findAll(settlementSpec(BeneficiaryType.PLUMBER, null, null, null, null), pageable(page, size)).map(this::toPlumberPayout);
    }

    public Page<DeliveryPayoutSummary> listDeliveryPayouts(int page, int size) {
        return settlementRepository.findAll(settlementSpec(BeneficiaryType.DELIVERY_PARTNER, null, null, null, null), pageable(page, size)).map(this::toDeliveryPayout);
    }

    public Page<RefundSummary> listRefunds(RefundStatus status, String search, LocalDate fromDate, LocalDate toDate, int page, int size) {
        return refundRequestRepository.findAll(refundSpec(status, search, fromDate, toDate), pageable(page, size)).map(this::toRefundSummary);
    }

    @Transactional
    public RefundSummary approveRefund(Long refundId, RefundActionRequest request) {
        return updateRefund(refundId, request, RefundStatus.APPROVED);
    }

    @Transactional
    public RefundSummary rejectRefund(Long refundId, RefundActionRequest request) {
        return updateRefund(refundId, request, RefundStatus.REJECTED);
    }

    public CommissionReportResponse getCommissionReport(LocalDate fromDate, LocalDate toDate) {
        BigDecimal productGross = productOrderRepository.findAll(productPaymentSpec("SUCCESS", null, fromDate, toDate)).stream().map(ProductOrder::getTotalAmount).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal serviceGross = serviceOrderRepository.findAll(servicePaidSpec(fromDate, toDate)).stream().map(ServiceOrder::getTotalAmount).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalGross = productGross.add(serviceGross);
        BigDecimal storeCommission = commission(productGross, STORE_COMMISSION_RATE);
        BigDecimal plumberCommission = commission(serviceGross, PLUMBER_COMMISSION_RATE);
        BigDecimal deliveryCommission = commission(productGross, DELIVERY_COMMISSION_RATE);
        BigDecimal totalCommission = storeCommission.add(plumberCommission).add(deliveryCommission);
        return new CommissionReportResponse(totalGross, totalCommission, storeCommission, plumberCommission, deliveryCommission, totalGross.subtract(totalCommission), LocalDateTime.now());
    }

    private RefundSummary updateRefund(Long refundId, RefundActionRequest request, RefundStatus nextStatus) {
        if (request == null || request.note() == null || request.note().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "note is required");
        }
        RefundRequest refund = refundRequestRepository.findById(refundId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Refund not found"));
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending refunds can be updated");
        }
        refund.setStatus(nextStatus);
        refund.setFinanceNote(request.note());
        refund.setProcessedAt(LocalDateTime.now());
        return toRefundSummary(refundRequestRepository.save(refund));
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id"));
    }

    private Specification<ProductOrder> productPaymentSpec(String status, String search, LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (status != null && !status.isBlank()) {
                predicate = cb.and(predicate, root.get("status").in(statusToOrderStatuses(status)));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                predicate = cb.and(predicate, cb.or(cb.like(cb.lower(root.get("customer").get("fullName")), pattern), cb.like(cb.lower(root.get("customer").get("phone")), pattern)));
            }
            if (fromDate != null) predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            if (toDate != null) predicate = cb.and(predicate, cb.lessThan(root.get("createdAt"), toDate.plusDays(1).atStartOfDay()));
            return predicate;
        };
    }

    private Specification<ServiceOrder> servicePaidSpec(LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            var predicate = cb.equal(root.get("status"), OrderStatus.PAID);
            if (fromDate != null) predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("completedAt"), fromDate.atStartOfDay()));
            if (toDate != null) predicate = cb.and(predicate, cb.lessThan(root.get("completedAt"), toDate.plusDays(1).atStartOfDay()));
            return predicate;
        };
    }

    private Specification<Settlement> settlementSpec(BeneficiaryType type, SettlementStatus status, Long beneficiaryId, LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            var predicate = cb.equal(root.get("beneficiaryType"), type);
            if (status != null) predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            if (beneficiaryId != null) predicate = cb.and(predicate, cb.equal(root.get("beneficiaryId"), beneficiaryId));
            if (fromDate != null) predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            if (toDate != null) predicate = cb.and(predicate, cb.lessThan(root.get("createdAt"), toDate.plusDays(1).atStartOfDay()));
            return predicate;
        };
    }

    private Specification<RefundRequest> refundSpec(RefundStatus status, String search, LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (status != null) predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            if (search != null && !search.isBlank()) predicate = cb.and(predicate, cb.like(cb.lower(root.get("reason")), "%" + search.toLowerCase().trim() + "%"));
            if (fromDate != null) predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("requestedAt"), fromDate.atStartOfDay()));
            if (toDate != null) predicate = cb.and(predicate, cb.lessThan(root.get("requestedAt"), toDate.plusDays(1).atStartOfDay()));
            return predicate;
        };
    }

    private List<ProductOrderStatus> statusToOrderStatuses(String status) {
        return switch (status.toUpperCase()) {
            case "SUCCESS", "PAID" -> List.of(ProductOrderStatus.CONFIRMED, ProductOrderStatus.PACKING, ProductOrderStatus.READY_FOR_PICKUP, ProductOrderStatus.OUT_FOR_DELIVERY, ProductOrderStatus.DELIVERED);
            case "FAILED" -> List.of(ProductOrderStatus.FAILED, ProductOrderStatus.CANCELLED);
            case "PENDING" -> List.of(ProductOrderStatus.PENDING);
            default -> List.of(ProductOrderStatus.values());
        };
    }

    private FinancePaymentSummary toPaymentSummary(ProductOrder order) {
        return new FinancePaymentSummary(paymentId(order), order.getId(), name(order.getCustomer()), order.getTotalAmount(), paymentStatus(order.getStatus()), "UNKNOWN", "UNKNOWN", order.getCreatedAt(), null);
    }

    private StoreSettlementSummary toStoreSettlement(Settlement settlement) {
        Store store = storeRepository.findById(settlement.getBeneficiaryId()).orElse(null);
        return new StoreSettlementSummary(settlement.getId(), settlement.getBeneficiaryId(), store == null ? "UNKNOWN" : store.getName(), settlement.getGrossAmount(), settlement.getCommissionAmount(), settlement.getNetAmount(), settlement.getStatus(), settlement.getCreatedAt(), settlement.getPaidAt());
    }

    private PlumberPayoutSummary toPlumberPayout(Settlement settlement) {
        User plumber = userRepository.findById(settlement.getBeneficiaryId()).orElse(null);
        long jobs = serviceOrderRepository.countByPlumber_Id(settlement.getBeneficiaryId());
        return new PlumberPayoutSummary(settlement.getId(), settlement.getBeneficiaryId(), name(plumber), jobs, settlement.getGrossAmount(), settlement.getCommissionAmount(), settlement.getNetAmount(), settlement.getStatus(), settlement.getCreatedAt(), settlement.getPaidAt());
    }

    private DeliveryPayoutSummary toDeliveryPayout(Settlement settlement) {
        User partner = userRepository.findById(settlement.getBeneficiaryId()).orElse(null);
        long deliveries = productOrderRepository.countByDeliveryPartnerId(settlement.getBeneficiaryId());
        return new DeliveryPayoutSummary(settlement.getId(), settlement.getBeneficiaryId(), name(partner), deliveries, settlement.getGrossAmount(), settlement.getCommissionAmount(), settlement.getNetAmount(), settlement.getStatus(), settlement.getCreatedAt(), settlement.getPaidAt());
    }

    private RefundSummary toRefundSummary(RefundRequest refund) {
        User customer = userRepository.findById(refund.getCustomerId()).orElse(null);
        return new RefundSummary(refund.getId(), refund.getOrderId(), name(customer), refund.getAmount(), refund.getReason(), refund.getStatus(), refund.getRequestedAt(), refund.getProcessedAt());
    }

    private String paymentId(ProductOrder order) { return "PO-" + order.getId(); }
    private Long parsePaymentId(String paymentId) { return Long.parseLong(paymentId.replace("PO-", "")); }
    private String paymentStatus(ProductOrderStatus status) { if (status == ProductOrderStatus.PENDING) return "PENDING"; if (status == ProductOrderStatus.FAILED || status == ProductOrderStatus.CANCELLED) return "FAILED"; return "SUCCESS"; }
    private String failureReason(ProductOrderStatus status) { return (status == ProductOrderStatus.FAILED || status == ProductOrderStatus.CANCELLED) ? "Order payment did not complete" : null; }
    private BigDecimal sumPaidServiceRevenue() { return serviceOrderRepository.findAll(servicePaidSpec(null, null)).stream().map(ServiceOrder::getTotalAmount).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add); }
    private BigDecimal sumProductRevenueBetween(LocalDateTime start, LocalDateTime end) { return productOrderRepository.findAll(productPaymentSpec("SUCCESS", null, start.toLocalDate(), end.toLocalDate().minusDays(1))).stream().map(ProductOrder::getTotalAmount).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add); }
    private BigDecimal sumServiceRevenueBetween(LocalDateTime start, LocalDateTime end) { return serviceOrderRepository.findAll(servicePaidSpec(start.toLocalDate(), end.toLocalDate().minusDays(1))).stream().map(ServiceOrder::getTotalAmount).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add); }
    private BigDecimal commission(BigDecimal amount, BigDecimal rate) { return safe(amount).multiply(rate).setScale(2, RoundingMode.HALF_UP); }
    private BigDecimal safe(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private String name(User user) { return user == null ? "UNKNOWN" : user.getFullName(); }
    private String phone(User user) { return user == null ? null : user.getPhone(); }
    private String email(User user) { return user == null ? null : user.getEmail(); }
}