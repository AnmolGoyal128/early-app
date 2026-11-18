package com.Project.EARLY.dto.observation;

import com.Project.EARLY.domain.enums.VerificationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BiomarkerObservationDto(
    UUID id,
    UUID patientId,
    UUID reportId,
    UUID sourceReportId,
    UUID encounterId,
    String loincCode,
    String testName,
    BigDecimal valueNumeric,
    String valueText,
    String unit,
    BigDecimal referenceLow,
    BigDecimal referenceHigh,
    Instant observedAt,
    BigDecimal ocrConfidence,
    VerificationStatus verificationStatus,
    UUID verifiedByUserId,
    Instant verifiedAt,
    Instant createdAt
) {}
