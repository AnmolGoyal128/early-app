package com.Project.EARLY.dto.consent;

import java.time.Instant;

public record RevokeConsentResponse(
    String status,
    Instant revokedAt
) {}
