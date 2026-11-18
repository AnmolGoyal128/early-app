package com.Project.EARLY;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.entity.UserEntity;
import com.Project.EARLY.domain.enums.FollowUpActionType;
import com.Project.EARLY.domain.enums.FollowUpStatus;
import com.Project.EARLY.domain.enums.SignalSeverity;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.rules.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RuleEngineTests {

    private BloodPressureElevationRule bpRule;
    private Hba1cDriftRule hba1cRule;
    private EgfrDeclineRule egfrRule;
    private OverdueFollowUpRule overdueRule;

    private PatientEntity patient;

    @BeforeEach
    void setUp() {
        bpRule = new BloodPressureElevationRule();
        hba1cRule = new Hba1cDriftRule();
        egfrRule = new EgfrDeclineRule();
        overdueRule = new OverdueFollowUpRule();

        UserEntity user = UserEntity.builder()
                .id(UUID.randomUUID())
                .fullName("Aarav Sharma")
                .email("aarav@example.com")
                .role(UserRole.PATIENT)
                .build();

        patient = PatientEntity.builder()
                .id(UUID.randomUUID())
                .user(user)
                .dateOfBirth(LocalDate.of(1980, 5, 20))
                .build();
    }

    @Test
    @DisplayName("BP Elevation Rule: Should trigger flag when Systolic >= 140 and no reassessment within 30 days")
    void testBloodPressureElevationTrigger() {
        BiomarkerObservationEntity obs = BiomarkerObservationEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .testName("Systolic BP")
                .valueNumeric(BigDecimal.valueOf(148))
                .unit("mmHg")
                .observedAt(Instant.now().minus(40, ChronoUnit.DAYS))
                .build();

        Optional<RuleEvaluationResult> result = bpRule.evaluate(patient, obs, List.of(obs), List.of());

        assertThat(result).isPresent();
        assertThat(result.get().ruleCode()).isEqualTo("BP_ELEVATED_REVIEW");
        assertThat(result.get().severity()).isEqualTo(SignalSeverity.HIGH);
        assertThat(result.get().patientMessage()).contains("Your previous report contains a finding that may need review.");
    }

    @Test
    @DisplayName("BP Elevation Rule: Should suppress flag when completed reassessment exists within 30 days")
    void testBloodPressureElevationSuppressedByReassessment() {
        Instant observedAt = Instant.now().minus(20, ChronoUnit.DAYS);
        BiomarkerObservationEntity obs = BiomarkerObservationEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .testName("Systolic BP")
                .valueNumeric(BigDecimal.valueOf(144))
                .unit("mmHg")
                .observedAt(observedAt)
                .build();

        FollowUpEntity reassessment = FollowUpEntity.builder()
                .id(UUID.randomUUID())
                .actionType(FollowUpActionType.REASSESSMENT_VISIT)
                .status(FollowUpStatus.COMPLETED)
                .completedAt(observedAt.plus(10, ChronoUnit.DAYS))
                .build();

        Optional<RuleEvaluationResult> result = bpRule.evaluate(patient, obs, List.of(obs), List.of(reassessment));
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("HbA1c Drift Rule: Should trigger when longitudinal drift is >= 0.5% within 180 days")
    void testHba1cDriftTrigger() {
        Instant t0 = Instant.now().minus(90, ChronoUnit.DAYS);
        Instant t1 = Instant.now();

        BiomarkerObservationEntity obs0 = BiomarkerObservationEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .testName("HbA1c")
                .valueNumeric(BigDecimal.valueOf(5.8))
                .unit("%")
                .observedAt(t0)
                .build();

        BiomarkerObservationEntity obs1 = BiomarkerObservationEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .testName("HbA1c")
                .valueNumeric(BigDecimal.valueOf(6.4)) // delta = +0.6%
                .unit("%")
                .observedAt(t1)
                .build();

        Optional<RuleEvaluationResult> result = hba1cRule.evaluate(patient, obs1, List.of(obs0, obs1), List.of());

        assertThat(result).isPresent();
        assertThat(result.get().ruleCode()).isEqualTo("HBA1C_DRIFT_6M");
        assertThat(result.get().clinicianMessage()).contains("shifted upward");
        assertThat(result.get().patientMessage()).contains("Your recent lab results show a trend");
    }

    @Test
    @DisplayName("eGFR Decline Rule: Should trigger when eGFR declines by >= 15% within 365 days")
    void testEgfrDeclineTrigger() {
        Instant t0 = Instant.now().minus(180, ChronoUnit.DAYS);
        Instant t1 = Instant.now();

        BiomarkerObservationEntity obs0 = BiomarkerObservationEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .testName("eGFR")
                .valueNumeric(BigDecimal.valueOf(90.0))
                .unit("mL/min/1.73m2")
                .observedAt(t0)
                .build();

        BiomarkerObservationEntity obs1 = BiomarkerObservationEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .testName("eGFR")
                .valueNumeric(BigDecimal.valueOf(72.0)) // decline of 20%
                .unit("mL/min/1.73m2")
                .observedAt(t1)
                .build();

        Optional<RuleEvaluationResult> result = egfrRule.evaluate(patient, obs1, List.of(obs0, obs1), List.of());

        assertThat(result).isPresent();
        assertThat(result.get().ruleCode()).isEqualTo("EGFR_DECLINE_15PCT");
        assertThat(result.get().clinicianMessage()).contains("declined by");
    }

    @Test
    @DisplayName("Overdue Follow-Up Rule: Should detect overdue tasks and transition status")
    void testOverdueFollowUpRule() {
        FollowUpEntity overdue = FollowUpEntity.builder()
                .id(UUID.randomUUID())
                .patient(patient)
                .title("Annual Lipid Panel")
                .actionType(FollowUpActionType.REPEAT_TEST)
                .dueDate(LocalDate.now().minusDays(5))
                .status(FollowUpStatus.PENDING)
                .build();

        Optional<RuleEvaluationResult> result = overdueRule.evaluate(patient, null, List.of(), List.of(overdue));

        assertThat(result).isPresent();
        assertThat(result.get().ruleCode()).isEqualTo("OVERDUE_FOLLOWUP_TASK");
        assertThat(overdue.getStatus()).isEqualTo(FollowUpStatus.OVERDUE);
    }
}
