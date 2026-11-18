package com.Project.EARLY.dto.encounter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EncounterRecordDto(
    UUID id,
    UUID patientId,
    UUID doctorId,
    String doctorName,
    UUID clinicId,
    String clinicName,
    Instant encounterDate,
    String chiefComplaint,
    String clinicalAssessment,
    String patientFriendlySummary,
    List<TreatmentRecordDto> treatments,
    Instant createdAt
) {}
