package com.Project.EARLY.rules;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.enums.FollowUpStatus;
import com.Project.EARLY.domain.enums.SignalSeverity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Component
public class BloodPressureElevationRule implements DeterministicRule {

    public static final String RULE_CODE = "BP_ELEVATED_REVIEW";

    @Override
    public String getRuleCode() {
        return RULE_CODE;
    }

    @Override
    public Optional<RuleEvaluationResult> evaluate(
            PatientEntity patient,
            BiomarkerObservationEntity newObservation,
            List<BiomarkerObservationEntity> historicalObservations,
            List<FollowUpEntity> followUps) {

        if (newObservation == null || newObservation.getValueNumeric() == null) {
            return Optional.empty();
        }

        String test = newObservation.getTestName().toLowerCase();
        BigDecimal val = newObservation.getValueNumeric();

        boolean isSystolic = test.contains("systolic") || "8480-6".equals(newObservation.getLoincCode());
        boolean isDiastolic = test.contains("diastolic") || "8462-4".equals(newObservation.getLoincCode());

        boolean isElevated = false;
        if (isSystolic && val.compareTo(BigDecimal.valueOf(140)) >= 0) {
            isElevated = true;
        } else if (isDiastolic && val.compareTo(BigDecimal.valueOf(90)) >= 0) {
            isElevated = true;
        }

        if (!isElevated) {
            return Optional.empty();
        }

        // Check if patient had completed reassessment visit within 30 days
        boolean hasReassessment = followUps != null && followUps.stream().anyMatch(f ->
                f.getStatus() == FollowUpStatus.COMPLETED &&
                f.getCompletedAt() != null &&
                Duration.between(newObservation.getObservedAt(), f.getCompletedAt()).toDays() >= 0 &&
                Duration.between(newObservation.getObservedAt(), f.getCompletedAt()).toDays() <= 30
        );

        if (hasReassessment) {
            return Optional.empty();
        }

        String clinicianMsg = String.format(
                "Blood pressure recorded at %s %s on %s. Recommended reassessment visit was not completed within 30 days.",
                val, newObservation.getUnit(), newObservation.getObservedAt()
        );
        String patientMsg = "Your previous report contains a finding that may need review. Please discuss it with your doctor.";

        return Optional.of(new RuleEvaluationResult(
                RULE_CODE,
                clinicianMsg,
                patientMsg,
                SignalSeverity.HIGH,
                newObservation
        ));
    }
}
