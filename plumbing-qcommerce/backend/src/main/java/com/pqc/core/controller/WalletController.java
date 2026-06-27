package com.pqc.core.controller;

import com.pqc.core.entity.User;
import com.pqc.core.entity.Wallet;
import com.pqc.core.entity.WalletTransaction;
import com.pqc.core.repository.WalletRepository;
import com.pqc.core.repository.WalletTransactionRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WalletController {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CurrentUser currentUser;

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
    public ResponseEntity<Wallet> topup(@RequestParam BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        User user = currentUser.require();
        Wallet wallet = getOrCreateWallet(user);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type("CREDIT")
                .description("Wallet Top-up")
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
