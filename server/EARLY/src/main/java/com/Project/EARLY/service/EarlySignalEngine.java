package com.Project.EARLY.service;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.EarlySignalFlagEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.dto.signal.EarlySignalFlagDto;
import com.Project.EARLY.dto.signal.PreventiveRuleDto;
import com.Project.EARLY.dto.signal.ReviewSignalRequest;
import com.Project.EARLY.security.UserPrincipal;

import java.util.List;
import java.util.UUID;

public interface EarlySignalEngine {
    List<EarlySignalFlagEntity> evaluateObservation(BiomarkerObservationEntity observation);
    List<EarlySignalFlagEntity> evaluatePatientFollowUps(PatientEntity patient);
    List<EarlySignalFlagDto> getSignalsForPatient(UUID patientId, UserPrincipal actor);
    EarlySignalFlagDto reviewSignal(UUID signalId, ReviewSignalRequest request, UserPrincipal actor);
    List<PreventiveRuleDto> getActiveRules();
}
