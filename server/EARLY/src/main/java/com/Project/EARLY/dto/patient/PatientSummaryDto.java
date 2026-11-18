package com.Project.EARLY.dto.patient;

import com.Project.EARLY.domain.enums.Gender;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PatientSummaryDto(
    UUID id,
    UUID userId,
    String fullName,
    String email,
    String phone,
    LocalDate dateOfBirth,
    Gender gender,
    String bloodGroup,
    String abhaNumber,
    String emergencyContactName,
    String emergencyContactPhone,
    boolean isSyntheticDemo,
    Instant createdAt
) {}
