package com.Project.EARLY.dto.report;

import com.Project.EARLY.domain.enums.ExtractionStatus;
import com.Project.EARLY.domain.enums.ReportType;
import com.Project.EARLY.dto.observation.BiomarkerObservationDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MedicalReportDto(
    UUID id,
    UUID patientId,
    UUID uploadedByUserId,
    UUID clinicId,
    String title,
    ReportType reportType,
    String sourceProviderName,
    LocalDate reportDate,
    String fileStorageKey,
    String fileMimeType,
    String fileSha256,
    ExtractionStatus extractionStatus,
    List<BiomarkerObservationDto> observations,
    Instant createdAt
) {}
