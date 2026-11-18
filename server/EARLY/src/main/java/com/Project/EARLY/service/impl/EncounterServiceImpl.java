package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.AuditAction;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.TreatmentStatus;
import com.Project.EARLY.dto.encounter.*;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.EncounterMapper;
import com.Project.EARLY.mapper.TreatmentMapper;
import com.Project.EARLY.repository.*;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import com.Project.EARLY.service.EncounterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EncounterServiceImpl implements EncounterService {

    private final ClinicalEncounterRepository encounterRepository;
    private final TreatmentRepository treatmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    private final EncounterMapper encounterMapper;
    private final TreatmentMapper treatmentMapper;
    private final ConsentService consentService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<EncounterRecordDto> getEncountersForPatient(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);
        return encounterRepository.findByPatientIdOrderByEncounterDateDesc(patientId)
                .stream()
                .map(encounterMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public EncounterRecordDto createEncounter(UUID patientId, CreateEncounterRequest request, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        DoctorEntity doctor = null;
        if (actor.getDoctorId() != null) {
            doctor = doctorRepository.findById(actor.getDoctorId()).orElse(null);
        }
        if (doctor == null) {
            doctor = doctorRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No doctor record found"));
        }

        ClinicEntity clinic = doctor.getClinic();
        if (clinic == null) {
            clinic = clinicRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No clinic record found"));
        }

        ClinicalEncounterEntity encounter = ClinicalEncounterEntity.builder()
                .patient(patient)
                .doctor(doctor)
                .clinic(clinic)
                .encounterDate(request.encounterDate() != null ? request.encounterDate() : Instant.now())
                .chiefComplaint(request.chiefComplaint())
                .clinicalAssessment(request.clinicalAssessment())
                .patientFriendlySummary(request.patientFriendlySummary())
                .treatments(new ArrayList<>())
                .build();

        ClinicalEncounterEntity savedEncounter = encounterRepository.save(encounter);

        if (request.treatments() != null) {
            for (CreateTreatmentItem item : request.treatments()) {
                TreatmentEntity treatment = TreatmentEntity.builder()
                        .patient(patient)
                        .encounter(savedEncounter)
                        .doctor(doctor)
                        .treatmentType(item.treatmentType())
                        .name(item.name())
                        .dosage(item.dosage())
                        .frequency(item.frequency())
                        .startDate(item.startDate() != null ? item.startDate() : LocalDate.now())
                        .endDate(item.endDate())
                        .status(TreatmentStatus.ACTIVE)
                        .notes(item.notes())
                        .build();

                TreatmentEntity savedTreatment = treatmentRepository.save(treatment);
                savedEncounter.getTreatments().add(savedTreatment);
            }
        }

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.ENCOUNTER_CREATED.name(),
                "ENCOUNTER",
                savedEncounter.getId(),
                null,
                Map.of("patientId", patientId.toString())
        );

        return encounterMapper.toDto(savedEncounter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TreatmentRecordDto> getTreatmentsForPatient(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);
        return treatmentRepository.findByPatientIdOrderByStartDateDesc(patientId)
                .stream()
                .map(treatmentMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public TreatmentRecordDto updateTreatmentStatus(UUID treatmentId, UpdateTreatmentStatusRequest request, UserPrincipal actor) {
        TreatmentEntity treatment = treatmentRepository.findById(treatmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Treatment not found: " + treatmentId));

        consentService.assertAccess(actor, treatment.getPatient().getId(), ConsentScope.FULL_HISTORY);

        treatment.setStatus(request.status());
        if (request.notes() != null) {
            treatment.setNotes(request.notes());
        }

        TreatmentEntity saved = treatmentRepository.save(treatment);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                "TREATMENT_UPDATED",
                "TREATMENT",
                treatmentId,
                null,
                Map.of("status", request.status().name(), "patientId", treatment.getPatient().getId().toString())
        );

        return treatmentMapper.toDto(saved);
    }
}
