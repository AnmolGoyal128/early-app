package com.Project.EARLY.rules;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.enums.SignalSeverity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class Hba1cDriftRule implements DeterministicRule {

    public static final String RULE_CODE = "HBA1C_DRIFT_6M";

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
        boolean isHba1c = test.contains("hba1c") || test.contains("glycated") || "4548-4".equals(newObservation.getLoincCode());
        if (!isHba1c) {
            return Optional.empty();
        }

        BigDecimal currentVal = newObservation.getValueNumeric();

        // 1. Longitudinal drift check within 180 days
        if (historicalObservations != null) {
            Optional<BiomarkerObservationEntity> priorObsOpt = historicalObservations.stream()
                    .filter(o -> !o.getId().equals(newObservation.getId()))
                    .filter(o -> (o.getTestName().toLowerCase().contains("hba1c") || "4548-4".equals(o.getLoincCode())) && o.getValueNumeric() != null)
                    .filter(o -> o.getObservedAt().isBefore(newObservation.getObservedAt()))
                    .filter(o -> Duration.between(o.getObservedAt(), newObservation.getObservedAt()).toDays() <= 180)
                    .min(Comparator.comparing(BiomarkerObservationEntity::getObservedAt)); // earliest within the 180-day window

            if (priorObsOpt.isPresent()) {
                BiomarkerObservationEntity priorObs = priorObsOpt.get();
                BigDecimal priorVal = priorObs.getValueNumeric();
                BigDecimal delta = currentVal.subtract(priorVal);
                long days = Duration.between(priorObs.getObservedAt(), newObservation.getObservedAt()).toDays();

                if (delta.compareTo(BigDecimal.valueOf(0.5)) >= 0) {
                    String clinicianMsg = String.format(
                            "HbA1c shifted upward from %.1f%% to %.1f%% (+%.1f%% over %d days). Pre-diabetic or diabetic drift requires review.",
                            priorVal, currentVal, delta, days
                    );
                    String patientMsg = "Your recent lab results show a trend that your doctor should examine at your next appointment.";

                    return Optional.of(new RuleEvaluationResult(
                            RULE_CODE,
                            clinicianMsg,
                            patientMsg,
                            SignalSeverity.HIGH,
                            newObservation
                    ));
                }
            }
        }

        // 2. Absolute threshold check (>= 6.5%)
        if (currentVal.compareTo(BigDecimal.valueOf(6.5)) >= 0) {
            String clinicianMsg = String.format(
                    "HbA1c recorded at %.1f%% on %s (exceeds 6.5%% diabetic threshold). Clinical review recommended.",
                    currentVal, newObservation.getObservedAt()
            );
            String patientMsg = "Your recent lab results show a trend that your doctor should examine at your next appointment.";

            return Optional.of(new RuleEvaluationResult(
                    RULE_CODE,
                    clinicianMsg,
                    patientMsg,
                    SignalSeverity.HIGH,
                    newObservation
            ));
        }

        return Optional.empty();
    }
}
