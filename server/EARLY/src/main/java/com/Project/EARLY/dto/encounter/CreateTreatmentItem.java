package com.Project.EARLY.dto.encounter;

import com.Project.EARLY.domain.enums.TreatmentType;

import java.time.LocalDate;

public record CreateTreatmentItem(
    TreatmentType treatmentType,
    String name,
    String dosage,
    String frequency,
    LocalDate startDate,
    LocalDate endDate,
    String notes
) {}
