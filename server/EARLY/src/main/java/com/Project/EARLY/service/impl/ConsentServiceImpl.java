package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.ClinicEntity;
import com.Project.EARLY.domain.entity.DoctorEntity;
import com.Project.EARLY.domain.entity.PatientConsentEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.enums.AuditAction;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.ConsentStatus;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.dto.consent.ConsentRecordDto;
import com.Project.EARLY.dto.consent.GrantConsentRequest;
import com.Project.EARLY.exception.ConsentRequiredException;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.ConsentMapper;
import com.Project.EARLY.repository.ClinicRepository;
import com.Project.EARLY.repository.DoctorRepository;
import com.Project.EARLY.repository.PatientConsentRepository;
import com.Project.EARLY.repository.PatientRepository;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsentServiceImpl implements ConsentService {

    private final PatientConsentRepository consentRepository;
    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final DoctorRepository doctorRepository;
    private final ConsentMapper consentMapper;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public void assertAccess(UserPrincipal actor, UUID patientId, ConsentScope requiredScope) {
        if (actor == null) {
            throw new ConsentRequiredException(patientId, "UNAUTHENTICATED", "Authentication required");
        }

        // 1. Patient self-check: patient can always view their own records
        if (actor.getRole() == UserRole.PATIENT) {
            if (actor.getPatientId() != null && actor.getPatientId().equals(patientId)) {
                return;
            }
            throw new ConsentRequiredException(patientId, "FORBIDDEN", "Access denied to another patient's records");
        }

        // 2. Clinician / Staff check
        UUID clinicId = actor.getClinicId();
        if (clinicId == null) {
            throw new ConsentRequiredException(patientId, "NO_CLINIC_AFFILIATION", "Actor must belong to a registered clinic");
        }

        UUID doctorId = actor.getDoctorId();
        Instant now = Instant.now();

        List<PatientConsentEntity> activeConsents = consentRepository.findActiveConsents(patientId, clinicId, doctorId, now);

        if (activeConsents.isEmpty()) {
            throw new ConsentRequiredException(patientId, "NO_ACTIVE_CONSENT", "Active patient consent is required to access this record.");
        }

        // Scope check
        if (requiredScope != null) {
            boolean scopeMatches = activeConsents.stream().anyMatch(consent -> isScopePermitted(consent.getScope(), requiredScope));
            if (!scopeMatches) {
                throw new ConsentRequiredException(patientId, "INSUFFICIENT_SCOPE", "Active consent does not cover the requested scope: " + requiredScope);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveConsent(UUID patientId, UUID clinicId, UUID doctorId, ConsentScope requiredScope) {
        if (patientId == null || clinicId == null) {
            return false;
        }
        Instant now = Instant.now();
        List<PatientConsentEntity> activeConsents = consentRepository.findActiveConsents(patientId, clinicId, doctorId, now);
        if (activeConsents.isEmpty()) {
            return false;
        }
        if (requiredScope == null) {
            return true;
        }
        return activeConsents.stream().anyMatch(c -> isScopePermitted(c.getScope(), requiredScope));
    }

    private boolean isScopePermitted(ConsentScope grantedScope, ConsentScope requestedScope) {
        if (grantedScope == ConsentScope.FULL_HISTORY) {
            return true;
        }
        return grantedScope == requestedScope;
    }

    @Override
    @Transactional
    public ConsentRecordDto grantConsent(UserPrincipal actor, GrantConsentRequest request) {
        UUID patientId = actor.getPatientId();
        if (patientId == null) {
            throw new ResourceNotFoundException("Patient profile not linked to user");
        }

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        ClinicEntity clinic = clinicRepository.findById(request.clinicId())
                .orElseThrow(() -> new ResourceNotFoundException("Clinic not found: " + request.clinicId()));

        DoctorEntity doctor = null;
        if (request.doctorId() != null) {
            doctor = doctorRepository.findById(request.doctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + request.doctorId()));
        }

        PatientConsentEntity consent = PatientConsentEntity.builder()
                .patient(patient)
                .clinic(clinic)
                .doctor(doctor)
                .scope(request.scope() != null ? request.scope() : ConsentScope.FULL_HISTORY)
                .status(ConsentStatus.ACTIVE)
                .grantedAt(Instant.now())
                .expiresAt(request.expiresAt())
                .build();

        PatientConsentEntity saved = consentRepository.save(consent);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.CONSENT_GRANTED.name(),
                "CONSENT",
                saved.getId(),
                null,
                Map.of("patientId", patientId.toString(), "clinicId", clinic.getId().toString())
        );

        return consentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void revokeConsent(UserPrincipal actor, UUID consentId) {
        PatientConsentEntity consent = consentRepository.findById(consentId)
                .orElseThrow(() -> new ResourceNotFoundException("Consent record not found: " + consentId));

        if (actor.getRole() == UserRole.PATIENT && actor.getPatientId() != null) {
            if (!consent.getPatient().getId().equals(actor.getPatientId())) {
                throw new ConsentRequiredException("You can only revoke consent for your own records");
            }
        }

        consent.setStatus(ConsentStatus.REVOKED);
        consent.setRevokedAt(Instant.now());
        consentRepository.save(consent);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.CONSENT_REVOKED.name(),
                "CONSENT",
                consent.getId(),
                null,
                Map.of("patientId", consent.getPatient().getId().toString(), "clinicId", consent.getClinic().getId().toString())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsentRecordDto> listConsentsForPatient(UUID patientId) {
        return consentRepository.findByPatientIdOrderByGrantedAtDesc(patientId)
                .stream()
                .map(consentMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsentRecordDto> listConsentsForClinic(UUID clinicId) {
        return consentRepository.findByClinicIdOrderByGrantedAtDesc(clinicId)
                .stream()
                .map(consentMapper::toDto)
                .toList();
    }
}
