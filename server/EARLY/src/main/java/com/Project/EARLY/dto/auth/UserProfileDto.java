package com.Project.EARLY.dto.auth;

import com.Project.EARLY.domain.enums.UserRole;

import java.util.UUID;

public record UserProfileDto(
    UUID id,
    String email,
    String fullName,
    String phone,
    UserRole role,
    boolean isActive,
    UUID patientId,
    UUID doctorId,
    UUID clinicId,
    String clinicName,
    String specialization,
    String medicalRegNumber
) {}
