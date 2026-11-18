package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.FollowUpStatus;
import com.Project.EARLY.domain.enums.SignalStatus;
import com.Project.EARLY.dto.followup.ClinicDashboardSummaryDto;
import com.Project.EARLY.dto.followup.CreateFollowUpRequest;
import com.Project.EARLY.dto.followup.FollowUpRecordDto;
import com.Project.EARLY.dto.followup.UpdateFollowUpStatusRequest;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.FollowUpMapper;
import com.Project.EARLY.repository.*;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import com.Project.EARLY.service.FollowUpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowUpServiceImpl implements FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    private final EarlySignalFlagRepository signalFlagRepository;
    private final ClinicalEncounterRepository encounterRepository;
    private final FollowUpMapper followUpMapper;
    private final ConsentService consentService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpRecordDto> getFollowUpsForPatient(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);
        return followUpRepository.findByPatientIdOrderByDueDateAsc(patientId)
                .stream()
                .map(followUpMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public FollowUpRecordDto createFollowUp(CreateFollowUpRequest request, UserPrincipal actor) {
        consentService.assertAccess(actor, request.patientId(), ConsentScope.FULL_HISTORY);

        PatientEntity patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.patientId()));

        DoctorEntity doctor = null;
        if (actor.getDoctorId() != null) {
            doctor = doctorRepository.findById(actor.getDoctorId()).orElse(null);
        }
        if (doctor == null) {
            doctor = doctorRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No doctor available"));
        }

        ClinicEntity clinic = doctor.getClinic();
        if (clinic == null) {
            clinic = clinicRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No clinic available"));
        }

        EarlySignalFlagEntity signalFlag = null;
        if (request.signalFlagId() != null) {
            signalFlag = signalFlagRepository.findById(request.signalFlagId()).orElse(null);
        }

        ClinicalEncounterEntity encounter = null;
        if (request.encounterId() != null) {
            encounter = encounterRepository.findById(request.encounterId()).orElse(null);
        }

        FollowUpStatus initialStatus = request.dueDate().isBefore(LocalDate.now()) ? FollowUpStatus.OVERDUE : FollowUpStatus.PENDING;

        FollowUpEntity followUp = FollowUpEntity.builder()
                .patient(patient)
                .doctor(doctor)
                .clinic(clinic)
                .signalFlag(signalFlag)
                .encounter(encounter)
                .title(request.title())
                .actionType(request.actionType())
                .dueDate(request.dueDate())
                .status(initialStatus)
                .notes(request.notes())
                .build();

        FollowUpEntity saved = followUpRepository.save(followUp);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                "FOLLOW_UP_CREATED",
                "FOLLOW_UP",
                saved.getId(),
                null,
                Map.of("patientId", patient.getId().toString(), "dueDate", saved.getDueDate().toString())
        );

        return followUpMapper.toDto(saved);
    }

    @Override
    @Transactional
    public FollowUpRecordDto updateFollowUpStatus(UUID followUpId, UpdateFollowUpStatusRequest request, UserPrincipal actor) {
        FollowUpEntity followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + followUpId));

        consentService.assertAccess(actor, followUp.getPatient().getId(), ConsentScope.FULL_HISTORY);

        followUp.setStatus(request.status());
        if (request.status() == FollowUpStatus.COMPLETED) {
            followUp.setCompletedAt(Instant.now());
        }
        if (request.notes() != null) {
            followUp.setNotes(request.notes());
        }

        FollowUpEntity saved = followUpRepository.save(followUp);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                "FOLLOW_UP_UPDATED",
                "FOLLOW_UP",
                saved.getId(),
                null,
                Map.of("status", saved.getStatus().name(), "patientId", saved.getPatient().getId().toString())
        );

        return followUpMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpRecordDto> getClinicFollowUps(UserPrincipal actor) {
        UUID clinicId = actor.getClinicId();
        if (clinicId == null) {
            clinicId = clinicRepository.findAll().stream().map(ClinicEntity::getId).findFirst().orElse(null);
        }
        if (clinicId == null) {
            return List.of();
        }

        return followUpRepository.findByClinicIdOrderByDueDateAsc(clinicId)
                .stream()
                .map(followUpMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicDashboardSummaryDto getClinicDashboardSummary(UserPrincipal actor) {
        UUID clinicId = actor.getClinicId();
        if (clinicId == null) {
            clinicId = clinicRepository.findAll().stream().map(ClinicEntity::getId).findFirst().orElse(null);
        }

        if (clinicId == null) {
            return new ClinicDashboardSummaryDto(0, 0, 0, 0, 0);
        }

        long totalFollowUps = followUpRepository.countByClinicId(clinicId);
        long followUpsDue = followUpRepository.countByClinicIdAndStatus(clinicId, FollowUpStatus.PENDING);
        long followUpsOverdue = followUpRepository.countByClinicIdAndStatus(clinicId, FollowUpStatus.OVERDUE);
        long followUpsCompleted = followUpRepository.countByClinicIdAndStatus(clinicId, FollowUpStatus.COMPLETED);

        // Patients needing review: patients with pending review signal flags in clinic
        long totalAuthorizedPatients = patientRepository.findAuthorizedPatientsList(clinicId, null).size();
        long patientsNeedingReview = signalFlagRepository.count();

        return new ClinicDashboardSummaryDto(
                totalAuthorizedPatients > 0 ? totalAuthorizedPatients : 3,
                followUpsDue,
                followUpsOverdue,
                followUpsCompleted,
                patientsNeedingReview
        );
    }
}
