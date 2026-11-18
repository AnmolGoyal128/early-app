package com.Project.EARLY.dto.governance;

import com.Project.EARLY.domain.enums.CorrectionStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateCorrectionStatusRequest(
    @NotNull CorrectionStatus status,
    String resolutionNotes
) {}
