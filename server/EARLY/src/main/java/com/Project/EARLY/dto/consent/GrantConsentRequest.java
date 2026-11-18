package com.Project.EARLY.dto.consent;

import com.Project.EARLY.domain.enums.ConsentScope;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record GrantConsentRequest(
    @NotNull UUID clinicId,
    UUID doctorId,
    ConsentScope scope,
    Instant expiresAt
) {}
