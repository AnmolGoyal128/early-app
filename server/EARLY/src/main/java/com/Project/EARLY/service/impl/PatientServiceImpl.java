package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.AuditAction;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.dto.patient.PatientSummaryDto;
import com.Project.EARLY.dto.patient.TimelineItemDto;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.PatientMapper;
import com.Project.EARLY.repository.*;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import com.Project.EARLY.service.PatientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final MedicalReportRepository reportRepository;
    private final BiomarkerObservationRepository observationRepository;
    private final ClinicalEncounterRepository encounterRepository;
    private final FollowUpRepository followUpRepository;
    private final PatientMapper patientMapper;
    private final ConsentService consentService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public PatientSummaryDto getPatientSummary(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.RECORD_VIEWED.name(),
                "PATIENT",
                patientId,
                null,
                Map.of("patientId", patientId.toString())
        );

        return patientMapper.toSummaryDto(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientSummaryDto getCurrentPatientSummary(UserPrincipal actor) {
        UUID patientId = actor.getPatientId();
        if (patientId == null) {
            throw new ResourceNotFoundException("No patient profile found for current user");
        }
        return getPatientSummary(patientId, actor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientSummaryDto> searchAuthorizedPatients(String query, UserPrincipal actor) {
        if (actor.getRole() == UserRole.PATIENT) {
            if (actor.getPatientId() != null) {
                return patientRepository.findById(actor.getPatientId())
                        .map(p -> List.of(patientMapper.toSummaryDto(p)))
                        .orElse(List.of());
            }
            return List.of();
        }

        UUID clinicId = actor.getClinicId();
        if (clinicId == null) {
            return List.of();
        }

        String search = (query != null && !query.isBlank()) ? query.trim() : null;
        return patientRepository.findAuthorizedPatientsList(clinicId, search)
                .stream()
                .map(patientMapper::toSummaryDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PatientSummaryDto> searchAuthorizedPatientsPaged(String query, UserPrincipal actor, Pageable pageable) {
        UUID clinicId = actor.getClinicId();
        String search = (query != null && !query.isBlank()) ? query.trim() : null;
        return patientRepository.findAuthorizedPatients(clinicId, search, pageable)
                .map(patientMapper::toSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimelineItemDto> getPatientTimeline(UUID patientId, String fromDate, String toDate, String type, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        List<TimelineItemDto> items = new ArrayList<>();

        // 1. Reports
        if (type == null || type.equalsIgnoreCase("ALL") || type.equalsIgnoreCase("REPORT")) {
            List<MedicalReportEntity> reports = reportRepository.findByPatientIdOrderByReportDateDesc(patientId);
            for (MedicalReportEntity r : reports) {
                items.add(new TimelineItemDto(
                        r.getId().toString(),
                        "REPORT",
                        r.getTitle(),
                        r.getSourceProviderName(),
                        r.getReportDate().toString(),
                        r.getExtractionStatus().name(),
                        Map.of("reportType", r.getReportType().name(), "sha256", r.getFileSha256())
                ));
            }
        }

        // 2. Encounters
        if (type == null || type.equalsIgnoreCase("ALL") || type.equalsIgnoreCase("ENCOUNTER")) {
            List<ClinicalEncounterEntity> encounters = encounterRepository.findByPatientIdOrderByEncounterDateDesc(patientId);
            for (ClinicalEncounterEntity e : encounters) {
                items.add(new TimelineItemDto(
                        e.getId().toString(),
                        "ENCOUNTER",
                        e.getChiefComplaint() != null ? e.getChiefComplaint() : "Consultation Encounter",
                        e.getDoctor() != null ? e.getDoctor().getUser().getFullName() : "Physician Consult",
                        e.getEncounterDate().toString(),
                        "COMPLETED",
                        Map.of("assessment", e.getClinicalAssessment() != null ? e.getClinicalAssessment() : "",
                               "summary", e.getPatientFriendlySummary() != null ? e.getPatientFriendlySummary() : "")
                ));
            }
        }

        // 3. Follow-Ups
        if (type == null || type.equalsIgnoreCase("ALL") || type.equalsIgnoreCase("FOLLOW_UP")) {
            List<FollowUpEntity> followUps = followUpRepository.findByPatientIdOrderByDueDateAsc(patientId);
            for (FollowUpEntity f : followUps) {
                items.add(new TimelineItemDto(
                        f.getId().toString(),
                        "FOLLOW_UP",
                        f.getTitle(),
                        f.getActionType().name(),
                        f.getDueDate().toString(),
                        f.getStatus().name(),
                        Map.of("dueDate", f.getDueDate().toString(), "notes", f.getNotes() != null ? f.getNotes() : "")
                ));
            }
        }

        // Sort reverse chronological
        items.sort((a, b) -> b.date().compareTo(a.date()));

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.TIMELINE_VIEWED.name(),
                "PATIENT",
                patientId,
                null,
                Map.of("patientId", patientId.toString())
        );

        return items;
    }
}
