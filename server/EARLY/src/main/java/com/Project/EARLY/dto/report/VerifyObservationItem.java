package com.Project.EARLY.dto.report;

import com.Project.EARLY.domain.enums.VerificationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VerifyObservationItem(
    UUID id,
    String testName,
    String loincCode,
    BigDecimal valueNumeric,
    String valueText,
    String unit,
    BigDecimal referenceLow,
    BigDecimal referenceHigh,
    Instant observedAt,
    VerificationStatus status
) {}
