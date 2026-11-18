package com.Project.EARLY;

import com.Project.EARLY.domain.entity.*;
import com.Project.EARLY.domain.enums.ConsentStatus;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RepositoryIntegrationTests {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClinicRepository clinicRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private PatientConsentRepository consentRepository;
    @Autowired
    private PreventiveRuleRepository ruleRepository;
    @Autowired
    private BiomarkerObservationRepository observationRepository;
    @Autowired
    private FollowUpRepository followUpRepository;

    @Test
    @DisplayName("Flyway Seeds: Verify 4 Clinical Preventive Rules exist")
    void testPreventiveRulesSeeded() {
        List<PreventiveRuleEntity> rules = ruleRepository.findByIsActiveTrue();
        assertThat(rules).hasSizeGreaterThanOrEqualTo(4);

        Optional<PreventiveRuleEntity> bpRule = ruleRepository.findByRuleCode("BP_ELEVATED_REVIEW");
        assertThat(bpRule).isPresent();
        assertThat(bpRule.get().getName()).contains("Blood Pressure");

        Optional<PreventiveRuleEntity> hba1cRule = ruleRepository.findByRuleCode("HBA1C_DRIFT_6M");
        assertThat(hba1cRule).isPresent();

        Optional<PreventiveRuleEntity> egfrRule = ruleRepository.findByRuleCode("EGFR_DECLINE_15PCT");
        assertThat(egfrRule).isPresent();

        Optional<PreventiveRuleEntity> overdueRule = ruleRepository.findByRuleCode("OVERDUE_FOLLOWUP_TASK");
        assertThat(overdueRule).isPresent();
    }

    @Test
    @DisplayName("Flyway Seeds: Verify Metropolitan Health Clinic and Dr. Priya Nair")
    void testClinicAndDoctorSeeded() {
        Optional<ClinicEntity> clinic = clinicRepository.findById(UUID.fromString("11111111-1111-1111-1111-111111111001"));
        assertThat(clinic).isPresent();
        assertThat(clinic.get().getName()).contains("Metropolitan Health Clinic");

        Optional<UserEntity> docUser = userRepository.findByEmail("priya.nair@metropolitanhealth.in");
        assertThat(docUser).isPresent();
        assertThat(docUser.get().getRole()).isEqualTo(UserRole.DOCTOR);

        Optional<DoctorEntity> doctor = doctorRepository.findByUserId(docUser.get().getId());
        assertThat(doctor).isPresent();
        assertThat(doctor.get().getSpecialization()).isEqualTo("Internal Medicine");
    }

    @Test
    @DisplayName("Flyway Seeds: Verify synthetic patients and active consents")
    void testSyntheticPatientsSeeded() {
        Optional<UserEntity> aaravUser = userRepository.findByEmail("aarav.sharma@example.com");
        assertThat(aaravUser).isPresent();
        assertThat(aaravUser.get().getRole()).isEqualTo(UserRole.PATIENT);

        UUID aaravPatientId = UUID.fromString("22222222-2222-2222-2222-222222221001");
        Optional<PatientEntity> aaravPatient = patientRepository.findById(aaravPatientId);
        assertThat(aaravPatient).isPresent();
        assertThat(aaravPatient.get().isSyntheticDemo()).isTrue();

        // Check active consent
        UUID clinicId = UUID.fromString("11111111-1111-1111-1111-111111111001");
        List<PatientConsentEntity> activeConsents = consentRepository.findActiveConsents(
                aaravPatientId, clinicId, null, Instant.now()
        );
        assertThat(activeConsents).isNotEmpty();
        assertThat(activeConsents.get(0).getStatus()).isEqualTo(ConsentStatus.ACTIVE);
    }

    @Test
    @DisplayName("Flyway Seeds: Verify longitudinal observations and trends for Aarav Sharma")
    void testObservationsAndTrends() {
        UUID aaravPatientId = UUID.fromString("22222222-2222-2222-2222-222222221001");

        List<BiomarkerObservationEntity> verifiedObs = observationRepository.findVerifiedForTrends(aaravPatientId);
        assertThat(verifiedObs).hasSizeGreaterThanOrEqualTo(5);

        // HbA1c observations should exist
        boolean hasHba1c = verifiedObs.stream().anyMatch(o -> o.getTestName().equals("HbA1c"));
        assertThat(hasHba1c).isTrue();

        // BP observations should exist
        boolean hasBp = verifiedObs.stream().anyMatch(o -> o.getTestName().contains("BP"));
        assertThat(hasBp).isTrue();
    }
}
