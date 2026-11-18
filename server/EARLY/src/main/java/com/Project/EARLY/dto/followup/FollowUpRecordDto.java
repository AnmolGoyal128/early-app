package com.Project.EARLY.dto.followup;

import com.Project.EARLY.domain.enums.FollowUpActionType;
import com.Project.EARLY.domain.enums.FollowUpStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FollowUpRecordDto(
    UUID id,
    UUID patientId,
    String patientName,
    UUID doctorId,
    String doctorName,
    UUID clinicId,
    UUID signalFlagId,
    UUID encounterId,
    String title,
    FollowUpActionType actionType,
    LocalDate dueDate,
    FollowUpStatus status,
    Instant completedAt,
    String notes,
    Instant createdAt
) {}
