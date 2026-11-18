package com.Project.EARLY.dto.followup;

import com.Project.EARLY.domain.enums.FollowUpActionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateFollowUpRequest(
    @NotNull UUID patientId,
    UUID signalFlagId,
    UUID encounterId,
    @NotBlank String title,
    @NotNull FollowUpActionType actionType,
    @NotNull LocalDate dueDate,
    String notes
) {}
