package com.pqc.core.controller;

import com.pqc.core.dto.*;
import com.pqc.core.entity.RefundStatus;
import com.pqc.core.entity.SettlementStatus;
import com.pqc.core.service.FinanceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')")
public class FinanceAdminController {
    private final FinanceAdminService financeAdminService;

    @GetMapping("/dashboard")
    public ResponseEntity<FinanceDashboardResponse> getDashboard() { return ResponseEntity.ok(financeAdminService.getDashboard()); }

    @GetMapping("/payments")
    public ResponseEntity<Page<FinancePaymentSummary>> getPayments(@RequestParam(required = false) String status, @RequestParam(required = false) String paymentMethod, @RequestParam(required = false) String search, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(financeAdminService.listPayments(status, paymentMethod, search, fromDate, toDate, page, size));
    }

    @GetMapping("/payments/{id}")
    public ResponseEntity<FinancePaymentDetail> getPayment(@PathVariable String id) { return ResponseEntity.ok(financeAdminService.getPayment(id)); }

    @GetMapping("/settlements/stores")
    public ResponseEntity<Page<StoreSettlementSummary>> getStoreSettlements(@RequestParam(required = false) SettlementStatus status, @RequestParam(required = false) Long storeId, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(financeAdminService.listStoreSettlements(status, storeId, fromDate, toDate, page, size));
    }

    @GetMapping("/payouts/plumbers")
    public ResponseEntity<Page<PlumberPayoutSummary>> getPlumberPayouts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return ResponseEntity.ok(financeAdminService.listPlumberPayouts(page, size)); }

    @GetMapping("/payouts/delivery-partners")
    public ResponseEntity<Page<DeliveryPayoutSummary>> getDeliveryPayouts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return ResponseEntity.ok(financeAdminService.listDeliveryPayouts(page, size)); }

    @GetMapping("/refunds")
    public ResponseEntity<Page<RefundSummary>> getRefunds(@RequestParam(required = false) RefundStatus status, @RequestParam(required = false) String search, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(financeAdminService.listRefunds(status, search, fromDate, toDate, page, size));
    }

    @PatchMapping("/refunds/{refundId}/approve")
    public ResponseEntity<RefundSummary> approveRefund(@PathVariable Long refundId, @RequestBody RefundActionRequest request) { return ResponseEntity.ok(financeAdminService.approveRefund(refundId, request)); }

    @PatchMapping("/refunds/{refundId}/reject")
    public ResponseEntity<RefundSummary> rejectRefund(@PathVariable Long refundId, @RequestBody RefundActionRequest request) { return ResponseEntity.ok(financeAdminService.rejectRefund(refundId, request)); }

    @GetMapping("/commission-report")
    public ResponseEntity<CommissionReportResponse> getCommissionReport(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) { return ResponseEntity.ok(financeAdminService.getCommissionReport(fromDate, toDate)); }
}