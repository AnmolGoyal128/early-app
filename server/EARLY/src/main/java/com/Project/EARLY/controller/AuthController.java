package com.Project.EARLY.controller;

import com.Project.EARLY.dto.auth.AuthResponse;
import com.Project.EARLY.dto.auth.LoginRequest;
import com.Project.EARLY.dto.auth.RefreshTokenRequest;
import com.Project.EARLY.dto.auth.RegisterRequest;
import com.Project.EARLY.dto.auth.UserProfileDto;
import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal actor) {
        UserProfileDto profile = authService.getCurrentProfile(actor);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
