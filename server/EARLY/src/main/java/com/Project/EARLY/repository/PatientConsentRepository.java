package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.PatientConsentEntity;
import com.Project.EARLY.domain.enums.ConsentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientConsentRepository extends JpaRepository<PatientConsentEntity, UUID> {
    List<PatientConsentEntity> findByPatientIdOrderByGrantedAtDesc(UUID patientId);
    List<PatientConsentEntity> findByClinicIdOrderByGrantedAtDesc(UUID clinicId);

    Optional<PatientConsentEntity> findByPatientIdAndClinicIdAndStatus(UUID patientId, UUID clinicId, ConsentStatus status);

    @Query("SELECT c FROM PatientConsentEntity c WHERE c.patient.id = :patientId " +
           "AND c.clinic.id = :clinicId " +
           "AND c.status = 'ACTIVE' " +
           "AND c.revokedAt IS NULL " +
           "AND (c.expiresAt IS NULL OR c.expiresAt > :now) " +
           "AND (:doctorId IS NULL OR c.doctor IS NULL OR c.doctor.id = :doctorId)")
    List<PatientConsentEntity> findActiveConsents(
        @Param("patientId") UUID patientId,
        @Param("clinicId") UUID clinicId,
        @Param("doctorId") UUID doctorId,
        @Param("now") Instant now
    );

    boolean existsByPatientIdAndClinicIdAndStatus(UUID patientId, UUID clinicId, ConsentStatus status);
}
