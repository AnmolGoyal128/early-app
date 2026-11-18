package com.Project.EARLY.dto.signal;

import com.Project.EARLY.domain.enums.SignalSeverity;
import com.Project.EARLY.domain.enums.SignalStatus;

import java.time.Instant;
import java.util.UUID;

public record EarlySignalFlagDto(
    UUID id,
    UUID patientId,
    String patientName,
    String ruleCode,
    String ruleTitle,
    UUID observationId,
    String clinicianMessage,
    String patientMessage,
    SignalSeverity severity,
    SignalStatus status,
    UUID reviewedByDoctorId,
    Instant reviewedAt,
    String clinicianNote,
    Instant flaggedAt
) {}
