package com.Project.EARLY;

import com.Project.EARLY.domain.entity.ClinicEntity;
import com.Project.EARLY.domain.entity.DoctorEntity;
import com.Project.EARLY.domain.entity.PatientConsentEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.ConsentStatus;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.exception.ConsentRequiredException;
import com.Project.EARLY.repository.ClinicRepository;
import com.Project.EARLY.repository.DoctorRepository;
import com.Project.EARLY.repository.PatientConsentRepository;
import com.Project.EARLY.repository.PatientRepository;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.impl.ConsentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsentServiceTests {

    @Mock
    private PatientConsentRepository consentRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private ClinicRepository clinicRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private ConsentServiceImpl consentService;

    private UUID patientId;
    private UUID clinicId;
    private UUID doctorId;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        clinicId = UUID.randomUUID();
        doctorId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Consent: Patient self-access should succeed without querying consents table")
    void testPatientSelfAccessAllowed() {
        UserPrincipal patientPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(UserRole.PATIENT)
                .patientId(patientId)
                .build();

        // Should not throw exception
        consentService.assertAccess(patientPrincipal, patientId, ConsentScope.FULL_HISTORY);
    }

    @Test
    @DisplayName("Consent: Patient accessing another patient's data should throw ConsentRequiredException")
    void testPatientAccessingOtherPatientForbidden() {
        UserPrincipal patientPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(UserRole.PATIENT)
                .patientId(UUID.randomUUID()) // different patient ID
                .build();

        assertThatThrownBy(() -> consentService.assertAccess(patientPrincipal, patientId, ConsentScope.FULL_HISTORY))
                .isInstanceOf(ConsentRequiredException.class)
                .hasMessageContaining("Access denied to another patient's records");
    }

    @Test
    @DisplayName("Consent: Doctor with active consent should be allowed access")
    void testDoctorWithActiveConsentAllowed() {
        UserPrincipal doctorPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(UserRole.DOCTOR)
                .clinicId(clinicId)
                .doctorId(doctorId)
                .build();

        PatientConsentEntity consent = PatientConsentEntity.builder()
                .id(UUID.randomUUID())
                .scope(ConsentScope.FULL_HISTORY)
                .status(ConsentStatus.ACTIVE)
                .build();

        when(consentRepository.findActiveConsents(eq(patientId), eq(clinicId), eq(doctorId), any(Instant.class)))
                .thenReturn(List.of(consent));

        consentService.assertAccess(doctorPrincipal, patientId, ConsentScope.FULL_HISTORY);
    }

    @Test
    @DisplayName("Consent: Doctor without active consent should be rejected with 403 CONSENT_REQUIRED")
    void testDoctorWithoutConsentRejected() {
        UserPrincipal doctorPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(UserRole.DOCTOR)
                .clinicId(clinicId)
                .doctorId(doctorId)
                .build();

        when(consentRepository.findActiveConsents(eq(patientId), eq(clinicId), eq(doctorId), any(Instant.class)))
                .thenReturn(List.of());

        assertThatThrownBy(() -> consentService.assertAccess(doctorPrincipal, patientId, ConsentScope.FULL_HISTORY))
                .isInstanceOf(ConsentRequiredException.class)
                .hasMessageContaining("Active patient consent is required");
    }

    @Test
    @DisplayName("Consent: Immediate revocation sets status REVOKED and blocks subsequent calls")
    void testImmediateRevocation() {
        UUID consentId = UUID.randomUUID();
        PatientEntity patient = PatientEntity.builder().id(patientId).build();
        ClinicEntity clinic = ClinicEntity.builder().id(clinicId).build();

        PatientConsentEntity consent = PatientConsentEntity.builder()
                .id(consentId)
                .patient(patient)
                .clinic(clinic)
                .status(ConsentStatus.ACTIVE)
                .build();

        when(consentRepository.findById(consentId)).thenReturn(Optional.of(consent));

        UserPrincipal patientPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(UserRole.PATIENT)
                .patientId(patientId)
                .build();

        consentService.revokeConsent(patientPrincipal, consentId);

        assertThat(consent.getStatus()).isEqualTo(ConsentStatus.REVOKED);
        assertThat(consent.getRevokedAt()).isNotNull();
        verify(consentRepository).save(consent);
    }
}
