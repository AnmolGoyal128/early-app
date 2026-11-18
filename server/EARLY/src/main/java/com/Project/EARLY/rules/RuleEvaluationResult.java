package com.Project.EARLY.rules;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.enums.SignalSeverity;

public record RuleEvaluationResult(
    String ruleCode,
    String clinicianMessage,
    String patientMessage,
    SignalSeverity severity,
    BiomarkerObservationEntity triggerObservation
) {}
