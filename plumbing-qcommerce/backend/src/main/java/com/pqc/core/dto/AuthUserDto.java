package com.pqc.core.dto;

import com.pqc.core.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserDto {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String phone;
    private Boolean phoneVerified;
    private Boolean profileComplete;
    private String authProvider;
    private String profileImageUrl;

    public static AuthUserDto from(User user) {
        return AuthUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .phoneVerified(user.getPhoneVerified())
                .profileComplete(user.getProfileComplete())
                .authProvider(user.getAuthProvider())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
