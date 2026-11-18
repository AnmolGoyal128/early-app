package com.Project.EARLY.rules;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.enums.FollowUpStatus;
import com.Project.EARLY.domain.enums.SignalSeverity;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Component
public class OverdueFollowUpRule implements DeterministicRule {

    public static final String RULE_CODE = "OVERDUE_FOLLOWUP_TASK";

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

        if (followUps == null) {
            return Optional.empty();
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Optional<FollowUpEntity> overdueOpt = followUps.stream()
                .filter(f -> (f.getStatus() == FollowUpStatus.PENDING || f.getStatus() == FollowUpStatus.OVERDUE) && f.getDueDate().isBefore(today))
                .findFirst();

        if (overdueOpt.isPresent()) {
            FollowUpEntity overdue = overdueOpt.get();
            // Mutate status to OVERDUE if still PENDING
            if (overdue.getStatus() == FollowUpStatus.PENDING) {
                overdue.setStatus(FollowUpStatus.OVERDUE);
            }

            String clinicianMsg = String.format(
                    "Preventive follow-up task '%s' is overdue (was due on %s). Action required to prevent care discontinuity.",
                    overdue.getTitle(), overdue.getDueDate()
            );
            String patientMsg = String.format(
                    "You have an upcoming or overdue health check ('%s'). Please contact your clinic to reschedule.",
                    overdue.getTitle()
            );

            return Optional.of(new RuleEvaluationResult(
                    RULE_CODE,
                    clinicianMsg,
                    patientMsg,
                    SignalSeverity.MEDIUM,
                    newObservation
            ));
        }

        return Optional.empty();
    }
}
