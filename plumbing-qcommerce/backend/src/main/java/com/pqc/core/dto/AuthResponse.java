package com.pqc.core.dto;

import com.pqc.core.entity.RefreshToken;
import com.pqc.core.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private Long userId;
    private String role;
    private String email;
    private String fullName;
    private String phone;
    private Boolean phoneVerified;
    private Boolean profileComplete;
    private String authProvider;
    private AuthUserDto user;

    public static AuthResponse from(User user, String token, RefreshToken refreshToken) {
        AuthUserDto userDto = AuthUserDto.from(user);
        return AuthResponse.builder()
                .token(token)
                .accessToken(token)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .role(user.getRole().name())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .phoneVerified(user.getPhoneVerified())
                .profileComplete(user.getProfileComplete())
                .authProvider(user.getAuthProvider())
                .user(userDto)
                .build();
    }
}
