package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.AuditAction;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.SignalStatus;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.dto.signal.EarlySignalFlagDto;
import com.Project.EARLY.dto.signal.PreventiveRuleDto;
import com.Project.EARLY.dto.signal.ReviewSignalRequest;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.mapper.EarlySignalMapper;
import com.Project.EARLY.mapper.PreventiveRuleMapper;
import com.Project.EARLY.repository.*;
import com.Project.EARLY.rules.DeterministicRule;
import com.Project.EARLY.rules.RuleEvaluationResult;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import com.Project.EARLY.service.EarlySignalEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EarlySignalEngineImpl implements EarlySignalEngine {

    private final List<DeterministicRule> deterministicRules;
    private final EarlySignalFlagRepository signalFlagRepository;
    private final PreventiveRuleRepository ruleRepository;
    private final BiomarkerObservationRepository observationRepository;
    private final FollowUpRepository followUpRepository;
    private final DoctorRepository doctorRepository;
    private final EarlySignalMapper signalMapper;
    private final PreventiveRuleMapper ruleMapper;
    private final ConsentService consentService;
    private final AuditService auditService;

    @Override
    @Transactional
    public List<EarlySignalFlagEntity> evaluateObservation(BiomarkerObservationEntity observation) {
        if (observation == null || observation.getPatient() == null) {
            return List.of();
        }

        PatientEntity patient = observation.getPatient();
        List<BiomarkerObservationEntity> history = observationRepository.findByPatientIdOrderByObservedAtDesc(patient.getId());
        List<FollowUpEntity> followUps = followUpRepository.findByPatientIdOrderByDueDateAsc(patient.getId());

        List<EarlySignalFlagEntity> triggeredFlags = new ArrayList<>();

        for (DeterministicRule rule : deterministicRules) {
            try {
                Optional<RuleEvaluationResult> resultOpt = rule.evaluate(patient, observation, history, followUps);
                if (resultOpt.isPresent()) {
                    RuleEvaluationResult res = resultOpt.get();
                    PreventiveRuleEntity ruleEntity = ruleRepository.findByRuleCode(res.ruleCode())
                            .orElse(null);

                    if (ruleEntity != null && ruleEntity.isActive()) {
                        EarlySignalFlagEntity flag = EarlySignalFlagEntity.builder()
                                .patient(patient)
                                .rule(ruleEntity)
                                .observation(res.triggerObservation() != null ? res.triggerObservation() : observation)
                                .clinicianMessage(res.clinicianMessage())
                                .patientMessage(res.patientMessage())
                                .status(SignalStatus.PENDING_REVIEW)
                                .build();

                        EarlySignalFlagEntity saved = signalFlagRepository.save(flag);
                        triggeredFlags.add(saved);
                        log.info("Triggered early signal flag for patient {} rule {}", patient.getId(), ruleEntity.getRuleCode());
                    }
                }
            } catch (Exception e) {
                log.error("Error evaluating rule {} for observation {}", rule.getRuleCode(), observation.getId(), e);
            }
        }

        return triggeredFlags;
    }

    @Override
    @Transactional
    public List<EarlySignalFlagEntity> evaluatePatientFollowUps(PatientEntity patient) {
        if (patient == null) return List.of();

        List<FollowUpEntity> followUps = followUpRepository.findByPatientIdOrderByDueDateAsc(patient.getId());
        List<EarlySignalFlagEntity> flags = new ArrayList<>();

        for (DeterministicRule rule : deterministicRules) {
            try {
                Optional<RuleEvaluationResult> resultOpt = rule.evaluate(patient, null, List.of(), followUps);
                if (resultOpt.isPresent()) {
                    RuleEvaluationResult res = resultOpt.get();
                    PreventiveRuleEntity ruleEntity = ruleRepository.findByRuleCode(res.ruleCode()).orElse(null);

                    if (ruleEntity != null && ruleEntity.isActive()) {
                        EarlySignalFlagEntity flag = EarlySignalFlagEntity.builder()
                                .patient(patient)
                                .rule(ruleEntity)
                                .observation(null)
                                .clinicianMessage(res.clinicianMessage())
                                .patientMessage(res.patientMessage())
                                .status(SignalStatus.PENDING_REVIEW)
                                .build();

                        flags.add(signalFlagRepository.save(flag));
                    }
                }
            } catch (Exception e) {
                log.error("Error evaluating follow-up rules for patient {}", patient.getId(), e);
            }
        }

        return flags;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EarlySignalFlagDto> getSignalsForPatient(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        List<EarlySignalFlagEntity> flags = signalFlagRepository.findByPatientIdOrderByCreatedAtDesc(patientId);

        // Role-sensitive projection
        if (actor.getRole() == UserRole.PATIENT) {
            return flags.stream()
                    .map(signalMapper::toPatientDto)
                    .toList();
        } else {
            return flags.stream()
                    .map(signalMapper::toDoctorDto)
                    .toList();
        }
    }

    @Override
    @Transactional
    public EarlySignalFlagDto reviewSignal(UUID signalId, ReviewSignalRequest request, UserPrincipal actor) {
        EarlySignalFlagEntity flag = signalFlagRepository.findById(signalId)
                .orElseThrow(() -> new ResourceNotFoundException("Signal flag not found: " + signalId));

        DoctorEntity doctor = null;
        if (actor.getDoctorId() != null) {
            doctor = doctorRepository.findById(actor.getDoctorId()).orElse(null);
        }

        flag.setStatus(request.status());
        flag.setClinicianNote(request.clinicianNote());
        flag.setReviewedByDoctor(doctor);
        flag.setReviewedAt(Instant.now());

        EarlySignalFlagEntity updated = signalFlagRepository.save(flag);

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.SIGNAL_REVIEWED.name(),
                "SIGNAL",
                updated.getId(),
                null,
                Map.of("status", request.status().name(), "patientId", flag.getPatient().getId().toString())
        );

        return signalMapper.toDoctorDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreventiveRuleDto> getActiveRules() {
        return ruleRepository.findByIsActiveTrue()
                .stream()
                .map(ruleMapper::toDto)
                .toList();
    }
}
