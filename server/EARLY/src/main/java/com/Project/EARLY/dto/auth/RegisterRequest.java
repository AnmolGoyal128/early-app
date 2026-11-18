package com.Project.EARLY.dto.auth;

import com.Project.EARLY.domain.enums.Gender;
import com.Project.EARLY.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6) String password,
    @NotBlank String fullName,
    String phone,
    @NotNull UserRole role,
    // Patient specific fields
    LocalDate dateOfBirth,
    Gender gender,
    String bloodGroup,
    String abhaNumber,
    // Doctor specific fields
    String medicalRegNumber,
    String specialization,
    UUID clinicId
) {}
