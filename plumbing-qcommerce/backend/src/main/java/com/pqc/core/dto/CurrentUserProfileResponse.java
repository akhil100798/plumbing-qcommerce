package com.pqc.core.dto;

public record CurrentUserProfileResponse(
        Long id, String email, String fullName, String role, String phone,
        Boolean phoneVerified, Boolean profileComplete, String authProvider,
        String profileImageUrl, Boolean availability) {
    public static CurrentUserProfileResponse from(AuthUserDto user) {
        return new CurrentUserProfileResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(),
                user.getPhone(), user.getPhoneVerified(), user.getProfileComplete(), user.getAuthProvider(),
                user.getProfileImageUrl(), user.getAvailability());
    }
}
