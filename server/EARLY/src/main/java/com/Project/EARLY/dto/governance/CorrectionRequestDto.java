package com.Project.EARLY.dto.governance;

import com.Project.EARLY.domain.enums.CorrectionStatus;

import java.time.Instant;
import java.util.UUID;

public record CorrectionRequestDto(
    UUID id,
    UUID patientId,
    String patientName,
    UUID observationId,
    UUID reportId,
    String requestedChange,
    CorrectionStatus status,
    UUID resolvedByUserId,
    String resolutionNotes,
    Instant createdAt
) {}
