package com.Project.EARLY.service;

import com.Project.EARLY.dto.auth.AuthResponse;
import com.Project.EARLY.dto.auth.LoginRequest;
import com.Project.EARLY.dto.auth.RefreshTokenRequest;
import com.Project.EARLY.dto.auth.RegisterRequest;
import com.Project.EARLY.dto.auth.UserProfileDto;
import com.Project.EARLY.security.UserPrincipal;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    UserProfileDto getCurrentProfile(UserPrincipal actor);
}
