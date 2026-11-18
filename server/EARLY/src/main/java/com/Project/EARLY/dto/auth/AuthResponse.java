package com.Project.EARLY.dto.auth;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UserProfileDto user
) {}
