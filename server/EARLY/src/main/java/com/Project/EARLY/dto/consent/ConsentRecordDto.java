package com.Project.EARLY.dto.consent;

import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.ConsentStatus;

import java.time.Instant;
import java.util.UUID;

public record ConsentRecordDto(
    UUID id,
    UUID patientId,
    UUID clinicId,
    String clinicName,
    UUID doctorId,
    String doctorName,
    ConsentScope scope,
    ConsentStatus status,
    Instant grantedAt,
    Instant expiresAt,
    Instant revokedAt
) {}
