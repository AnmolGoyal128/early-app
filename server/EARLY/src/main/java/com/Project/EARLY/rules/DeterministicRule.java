package com.Project.EARLY.rules;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.entity.PatientEntity;

import java.util.List;
import java.util.Optional;

public interface DeterministicRule {
    String getRuleCode();
    Optional<RuleEvaluationResult> evaluate(
            PatientEntity patient,
            BiomarkerObservationEntity newObservation,
            List<BiomarkerObservationEntity> historicalObservations,
            List<FollowUpEntity> followUps
    );
}
