package com.Project.EARLY.dto.encounter;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public record CreateEncounterRequest(
    @NotNull Instant encounterDate,
    String chiefComplaint,
    String clinicalAssessment,
    String patientFriendlySummary,
    List<CreateTreatmentItem> treatments
) {}
