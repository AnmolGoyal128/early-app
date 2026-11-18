package com.Project.EARLY.rules;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.enums.SignalSeverity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class EgfrDeclineRule implements DeterministicRule {

    public static final String RULE_CODE = "EGFR_DECLINE_15PCT";

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
        boolean isEgfr = test.contains("egfr") || test.contains("estimated gfr") || "33914-3".equals(newObservation.getLoincCode());
        if (!isEgfr) {
            return Optional.empty();
        }

        BigDecimal currentVal = newObservation.getValueNumeric();

        // 1. Longitudinal decline check (>= 15% decline within 365 days)
        if (historicalObservations != null) {
            Optional<BiomarkerObservationEntity> priorObsOpt = historicalObservations.stream()
                    .filter(o -> !o.getId().equals(newObservation.getId()))
                    .filter(o -> (o.getTestName().toLowerCase().contains("egfr") || "33914-3".equals(o.getLoincCode())) && o.getValueNumeric() != null)
                    .filter(o -> o.getObservedAt().isBefore(newObservation.getObservedAt()))
                    .filter(o -> Duration.between(o.getObservedAt(), newObservation.getObservedAt()).toDays() <= 365)
                    .max(Comparator.comparing(BiomarkerObservationEntity::getObservedAt)); // most recent baseline

            if (priorObsOpt.isPresent()) {
                BiomarkerObservationEntity priorObs = priorObsOpt.get();
                BigDecimal priorVal = priorObs.getValueNumeric();

                if (priorVal.compareTo(BigDecimal.ZERO) > 0 && currentVal.compareTo(priorVal) < 0) {
                    BigDecimal drop = priorVal.subtract(currentVal);
                    BigDecimal pctDrop = drop.divide(priorVal, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

                    if (pctDrop.compareTo(BigDecimal.valueOf(15.0)) >= 0) {
                        long days = Duration.between(priorObs.getObservedAt(), newObservation.getObservedAt()).toDays();
                        String clinicianMsg = String.format(
                                "eGFR has declined by %.1f%% from baseline %.1f to %.1f %s within %d days. Monitor renal filtration velocity.",
                                pctDrop, priorVal, currentVal, newObservation.getUnit(), days
                        );
                        String patientMsg = "Your previous report contains a kidney function marker that may need review. Please share this report with your doctor to decide if a follow-up test is recommended.";

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
        }

        // 2. Absolute threshold check (< 60 mL/min/1.73m²)
        if (currentVal.compareTo(BigDecimal.valueOf(60.0)) < 0) {
            String clinicianMsg = String.format(
                    "eGFR recorded at %.1f %s (< 60 threshold indicating potential renal impairment).",
                    currentVal, newObservation.getUnit()
            );
            String patientMsg = "Your previous report contains a kidney function marker that may need review. Please share this report with your doctor to decide if a follow-up test is recommended.";

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
