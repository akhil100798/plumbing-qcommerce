package com.pqc.core.service;

import com.pqc.core.entity.RefreshToken;
import com.pqc.core.entity.User;
import com.pqc.core.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke any existing refresh tokens for the user to enforce single-session or clear previous ones
        refreshTokenRepository.deleteByUser_Id(user.getId());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusDays(7)) // 7 days expiration
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isRevoked() || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired or revoked. Please sign in again.");
        }
        return token;
    }

    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }

    @Transactional
    public void revokeByUser(Long userId) {
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    @Transactional
    public RefreshToken rotateToken(String oldTokenStr) {
        RefreshToken oldToken = findByToken(oldTokenStr);
        verifyExpiration(oldToken);

        User user = oldToken.getUser();
        // Generate new token and delete old token
        RefreshToken newToken = createRefreshToken(user);
        refreshTokenRepository.delete(oldToken);
        
        return newToken;
    }
}
