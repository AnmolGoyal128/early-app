package com.Project.EARLY;

import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.security.JwtTokenProvider;
import com.Project.EARLY.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTests {

    private JwtTokenProvider tokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, 900000, 604800000);
    }

    @Test
    @DisplayName("JWT: Generate and validate access token with claims")
    void testGenerateAndValidateAccessToken() {
        UUID userId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        UserPrincipal principal = UserPrincipal.builder()
                .id(userId)
                .email("test.patient@example.com")
                .fullName("Test Patient")
                .role(UserRole.PATIENT)
                .active(true)
                .patientId(patientId)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .build();

        String token = tokenProvider.generateAccessToken(principal);

        assertThat(token).isNotBlank();
        assertThat(tokenProvider.validateToken(token)).isTrue();
        assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(tokenProvider.getRoleFromToken(token)).isEqualTo("PATIENT");

        Claims claims = tokenProvider.getClaims(token);
        assertThat(claims.get("email", String.class)).isEqualTo("test.patient@example.com");
        assertThat(claims.get("patientId", String.class)).isEqualTo(patientId.toString());
    }

    @Test
    @DisplayName("JWT: Reject invalid or tampered tokens")
    void testRejectInvalidToken() {
        assertThat(tokenProvider.validateToken("invalid.jwt.token")).isFalse();
        assertThat(tokenProvider.validateToken("")).isFalse();
    }

    @Test
    @DisplayName("JWT: Generate refresh token with REFRESH claim")
    void testGenerateRefreshToken() {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = UserPrincipal.builder()
                .id(userId)
                .email("user@example.com")
                .role(UserRole.DOCTOR)
                .active(true)
                .build();

        String refreshToken = tokenProvider.generateRefreshToken(principal);
        assertThat(tokenProvider.validateToken(refreshToken)).isTrue();
        Claims claims = tokenProvider.getClaims(refreshToken);
        assertThat(claims.get("tokenType", String.class)).isEqualTo("REFRESH");
    }
}
