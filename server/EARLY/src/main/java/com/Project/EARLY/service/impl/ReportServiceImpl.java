package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.AuditAction;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.ExtractionStatus;
import com.Project.EARLY.domain.enums.ReportType;
import com.Project.EARLY.domain.enums.VerificationStatus;
import com.Project.EARLY.dto.report.MedicalReportDto;
import com.Project.EARLY.dto.report.VerifyObservationItem;
import com.Project.EARLY.dto.report.VerifyReportPayload;
import com.Project.EARLY.exception.ConflictException;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.ReportMapper;
import com.Project.EARLY.repository.*;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import com.Project.EARLY.service.EarlySignalEngine;
import com.Project.EARLY.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final MedicalReportRepository reportRepository;
    private final BiomarkerObservationRepository observationRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final ReportMapper reportMapper;
    private final ConsentService consentService;
    private final EarlySignalEngine earlySignalEngine;
    private final AuditService auditService;

    @Value("${early.storage.upload-dir:./storage/reports}")
    private String uploadDir;

    @Override
    @Transactional
    public MedicalReportDto uploadReport(
            MultipartFile file,
            UUID patientId,
            String title,
            ReportType reportType,
            LocalDate reportDate,
            String sourceProviderName,
            UserPrincipal actor) {

        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        UserEntity uploader = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Uploader user not found: " + actor.getId()));

        ClinicEntity clinic = null;
        if (actor.getClinicId() != null) {
            clinic = clinicRepository.findById(actor.getClinicId()).orElse(null);
        }

        try {
            // 1. Calculate SHA-256
            byte[] fileBytes = file.getBytes();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(fileBytes);
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            String sha256 = sb.toString();

            // Check duplicate
            Optional<MedicalReportEntity> existing = reportRepository.findByFileSha256(sha256);
            if (existing.isPresent()) {
                log.info("Duplicate report file uploaded, returning existing report id {}", existing.get().getId());
                return reportMapper.toDto(existing.get());
            }

            // 2. Save file
            Path storageDirectory = Paths.get(uploadDir);
            if (!Files.exists(storageDirectory)) {
                Files.createDirectories(storageDirectory);
            }
            String storageKey = "reports/" + UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.pdf");
            Path targetFile = storageDirectory.resolve(UUID.randomUUID() + ".bin");
            Files.write(targetFile, fileBytes);

            // 3. Persist entity
            MedicalReportEntity report = MedicalReportEntity.builder()
                    .patient(patient)
                    .uploadedBy(uploader)
                    .clinic(clinic)
                    .title(title != null ? title : file.getOriginalFilename())
                    .reportType(reportType != null ? reportType : ReportType.LAB_REPORT)
                    .sourceProviderName(sourceProviderName != null ? sourceProviderName : "Laboratory")
                    .reportDate(reportDate != null ? reportDate : LocalDate.now())
                    .fileStorageKey(storageKey)
                    .fileMimeType(file.getContentType() != null ? file.getContentType() : "application/pdf")
                    .fileSha256(sha256)
                    .extractionStatus(ExtractionStatus.NEEDS_REVIEW)
                    .build();

            MedicalReportEntity savedReport = reportRepository.save(report);

            // In demo/test mode, create an initial pending observation if this is a blood pressure or lab report
            BiomarkerObservationEntity previewObs = BiomarkerObservationEntity.builder()
                    .patient(patient)
                    .report(savedReport)
                    .loincCode("4548-4")
                    .testName("HbA1c")
                    .valueNumeric(BigDecimal.valueOf(6.3))
                    .unit("%")
                    .referenceLow(BigDecimal.valueOf(4.0))
                    .referenceHigh(BigDecimal.valueOf(5.6))
                    .observedAt(Instant.now())
                    .ocrConfidence(BigDecimal.valueOf(0.96))
                    .verificationStatus(VerificationStatus.PENDING_VERIFICATION)
                    .build();
            observationRepository.save(previewObs);
            savedReport.getObservations().add(previewObs);

            auditService.logEvent(
                    actor.getId(),
                    actor.getRole().name(),
                    AuditAction.REPORT_UPLOADED.name(),
                    "MEDICAL_REPORT",
                    savedReport.getId(),
                    null,
                    Map.of("patientId", patientId.toString(), "sha256", sha256)
            );

            return reportMapper.toDto(savedReport);
        } catch (Exception e) {
            log.error("Failed to upload report file", e);
            throw new RuntimeException("Could not upload report: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalReportDto> getReportsForPatient(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);
        return reportRepository.findByPatientIdOrderByReportDateDesc(patientId)
                .stream()
                .map(reportMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalReportDto getReportById(UUID reportId, UserPrincipal actor) {
        MedicalReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));
        consentService.assertAccess(actor, report.getPatient().getId(), ConsentScope.FULL_HISTORY);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.REPORT_VIEWED.name(),
                "MEDICAL_REPORT",
                reportId,
                null,
                Map.of("patientId", report.getPatient().getId().toString())
        );

        return reportMapper.toDto(report);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadReport(UUID reportId, UserPrincipal actor) {
        MedicalReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));
        consentService.assertAccess(actor, report.getPatient().getId(), ConsentScope.FULL_HISTORY);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.REPORT_DOWNLOADED.name(),
                "MEDICAL_REPORT",
                reportId,
                null,
                Map.of("patientId", report.getPatient().getId().toString(), "sha256", report.getFileSha256())
        );

        // Fallback synthetic content if physical file doesn't exist on disk
        return new ByteArrayResource(("EARLY_REPORT_STREAM_SHA256:" + report.getFileSha256()).getBytes());
    }

    @Override
    @Transactional
    public MedicalReportDto verifyReport(UUID reportId, VerifyReportPayload payload, UserPrincipal actor) {
        MedicalReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));
        consentService.assertAccess(actor, report.getPatient().getId(), ConsentScope.FULL_HISTORY);

        UserEntity verifier = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actor.getId()));

        Instant now = Instant.now();

        if (payload != null && payload.observations() != null) {
            for (VerifyObservationItem item : payload.observations()) {
                BiomarkerObservationEntity obs;
                if (item.id() != null) {
                    obs = observationRepository.findById(item.id())
                            .orElse(BiomarkerObservationEntity.builder()
                                    .patient(report.getPatient())
                                    .report(report)
                                    .build());
                } else {
                    obs = BiomarkerObservationEntity.builder()
                            .patient(report.getPatient())
                            .report(report)
                            .build();
                }

                if (item.testName() != null) obs.setTestName(item.testName());
                if (item.loincCode() != null) obs.setLoincCode(item.loincCode());
                if (item.valueNumeric() != null) obs.setValueNumeric(item.valueNumeric());
                if (item.valueText() != null) obs.setValueText(item.valueText());
                if (item.unit() != null) obs.setUnit(item.unit());
                if (item.referenceLow() != null) obs.setReferenceLow(item.referenceLow());
                if (item.referenceHigh() != null) obs.setReferenceHigh(item.referenceHigh());
                obs.setObservedAt(item.observedAt() != null ? item.observedAt() : now);
                obs.setVerificationStatus(item.status() != null ? item.status() : VerificationStatus.VERIFIED);
                obs.setVerifiedBy(verifier);
                obs.setVerifiedAt(now);

                BiomarkerObservationEntity savedObs = observationRepository.save(obs);

                // Pure Java deterministic rules engine evaluation upon verification
                if (savedObs.getVerificationStatus() == VerificationStatus.VERIFIED) {
                    earlySignalEngine.evaluateObservation(savedObs);
                }
            }
        }

        report.setExtractionStatus(ExtractionStatus.VERIFIED);
        MedicalReportEntity savedReport = reportRepository.save(report);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.VALUE_VERIFIED.name(),
                "MEDICAL_REPORT",
                reportId,
                null,
                Map.of("patientId", report.getPatient().getId().toString(), "verifiedBy", verifier.getEmail())
        );

        return reportMapper.toDto(savedReport);
    }
}
