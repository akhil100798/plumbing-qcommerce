package com.pqc.core.controller;

import com.pqc.core.dto.WalletTopupRequest;
import com.pqc.core.entity.User;
import com.pqc.core.entity.Wallet;
import com.pqc.core.entity.WalletTransaction;
import com.pqc.core.repository.WalletRepository;
import com.pqc.core.repository.WalletTransactionRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.PaymentGatewayAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WalletController {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CurrentUser currentUser;
    private final PaymentGatewayAdapter paymentGatewayAdapter;

    private Wallet getOrCreateWallet(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .user(user)
                        .balance(BigDecimal.ZERO)
                        .build()));
    }

    @GetMapping
    public ResponseEntity<Wallet> getWallet() {
        User user = currentUser.require();
        Wallet wallet = getOrCreateWallet(user);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/topup")
    @Transactional
    public ResponseEntity<Wallet> topup(
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String paymentMethodId,
            @RequestParam(required = false) String transactionId,
            @RequestBody(required = false) WalletTopupRequest body) {
        
        BigDecimal targetAmount = body != null && body.getAmount() != null ? body.getAmount() : amount;
        String instrument = body != null && body.getPaymentMethodId() != null ? body.getPaymentMethodId() : paymentMethodId;
        String txRef = body != null && body.getTransactionId() != null ? body.getTransactionId() : transactionId;

        if (targetAmount == null || targetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        User user = currentUser.require();
        String paymentInstrument = instrument != null && !instrument.isBlank() ? instrument : txRef;
        if (paymentInstrument == null || paymentInstrument.isBlank()) {
            paymentInstrument = "pm_wallet_topup_" + UUID.randomUUID().toString().substring(0, 8);
        }

        String idempotencyKey = "topup_" + user.getId() + "_" + System.currentTimeMillis();
        String gatewayTxId = paymentGatewayAdapter.capturePayment(
                user.getId(), targetAmount, paymentInstrument, "INR", idempotencyKey
        );

        Wallet wallet = getOrCreateWallet(user);
        wallet.setBalance(wallet.getBalance().add(targetAmount));
        walletRepository.save(wallet);

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(wallet)
                .amount(targetAmount)
                .type("CREDIT")
                .description("Wallet Top-up (Tx: " + gatewayTxId + ")")
                .build());

        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/pay")
    @Transactional
    public ResponseEntity<Wallet> pay(@RequestParam BigDecimal amount, @RequestParam String description) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        User user = currentUser.require();
        Wallet wallet = getOrCreateWallet(user);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient wallet balance");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type("DEBIT")
                .description(description)
                .build());

        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions() {
        User user = currentUser.require();
        Wallet wallet = getOrCreateWallet(user);
        return ResponseEntity.ok(walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()));
    }
}
