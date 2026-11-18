package com.Project.EARLY.dto.encounter;

import com.Project.EARLY.domain.enums.TreatmentStatus;
import com.Project.EARLY.domain.enums.TreatmentType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TreatmentRecordDto(
    UUID id,
    UUID patientId,
    UUID encounterId,
    UUID doctorId,
    TreatmentType treatmentType,
    String name,
    String dosage,
    String frequency,
    LocalDate startDate,
    LocalDate endDate,
    TreatmentStatus status,
    String notes,
    Instant createdAt
) {}
