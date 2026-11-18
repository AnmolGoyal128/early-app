package com.Project.EARLY.dto.encounter;

import com.Project.EARLY.domain.enums.TreatmentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTreatmentStatusRequest(
    @NotNull TreatmentStatus status,
    String notes
) {}
