package com.Project.EARLY.dto.followup;

import com.Project.EARLY.domain.enums.FollowUpStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateFollowUpStatusRequest(
    @NotNull FollowUpStatus status,
    String notes
) {}
