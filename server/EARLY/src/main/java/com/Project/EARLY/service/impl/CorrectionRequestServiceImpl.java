package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.CorrectionStatus;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.dto.governance.CorrectionRequestDto;
import com.Project.EARLY.dto.governance.CreateCorrectionRequest;
import com.Project.EARLY.dto.governance.UpdateCorrectionStatusRequest;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.CorrectionRequestMapper;
import com.Project.EARLY.repository.*;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.CorrectionRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CorrectionRequestServiceImpl implements CorrectionRequestService {

    private final CorrectionRequestRepository correctionRequestRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final BiomarkerObservationRepository observationRepository;
    private final MedicalReportRepository reportRepository;
    private final CorrectionRequestMapper correctionRequestMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public CorrectionRequestDto createCorrectionRequest(CreateCorrectionRequest request, UserPrincipal actor) {
        UUID patientId = actor.getPatientId();
        if (patientId == null) {
            throw new ResourceNotFoundException("Patient profile not linked to user");
        }

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        BiomarkerObservationEntity obs = null;
        if (request.observationId() != null) {
            obs = observationRepository.findById(request.observationId()).orElse(null);
        }

        MedicalReportEntity report = null;
        if (request.reportId() != null) {
            report = reportRepository.findById(request.reportId()).orElse(null);
        }

        CorrectionRequestEntity entity = CorrectionRequestEntity.builder()
                .patient(patient)
                .observation(obs)
                .report(report)
                .requestedChange(request.requestedChange())
                .status(CorrectionStatus.OPEN)
                .build();

        CorrectionRequestEntity saved = correctionRequestRepository.save(entity);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                "CORRECTION_SUBMITTED",
                "CORRECTION_REQUEST",
                saved.getId(),
                null,
                Map.of("patientId", patientId.toString())
        );

        return correctionRequestMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CorrectionRequestDto> getCorrectionRequests(UserPrincipal actor) {
        if (actor.getRole() == UserRole.PATIENT && actor.getPatientId() != null) {
            return correctionRequestRepository.findByPatientIdOrderByCreatedAtDesc(actor.getPatientId())
                    .stream()
                    .map(correctionRequestMapper::toDto)
                    .toList();
        }

        return correctionRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(correctionRequestMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public CorrectionRequestDto updateCorrectionStatus(UUID id, UpdateCorrectionStatusRequest request, UserPrincipal actor) {
        CorrectionRequestEntity entity = correctionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Correction request not found: " + id));

        UserEntity resolver = userRepository.findById(actor.getId()).orElse(null);

        entity.setStatus(request.status());
        entity.setResolvedBy(resolver);
        entity.setResolutionNotes(request.resolutionNotes());

        CorrectionRequestEntity saved = correctionRequestRepository.save(entity);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                "CORRECTION_RESOLVED",
                "CORRECTION_REQUEST",
                saved.getId(),
                null,
                Map.of("status", request.status().name(), "patientId", entity.getPatient().getId().toString())
        );

        return correctionRequestMapper.toDto(saved);
    }
}
