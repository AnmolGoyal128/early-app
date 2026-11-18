package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface BiomarkerObservationRepository extends JpaRepository<BiomarkerObservationEntity, UUID> {
    List<BiomarkerObservationEntity> findByPatientIdOrderByObservedAtDesc(UUID patientId);

    @Query("SELECT b FROM BiomarkerObservationEntity b WHERE b.patient.id = :patientId " +
           "AND (:testName IS NULL OR LOWER(b.testName) = LOWER(:testName)) " +
           "AND (:loincCode IS NULL OR b.loincCode = :loincCode) " +
           "AND (:status IS NULL OR b.verificationStatus = :status) " +
           "AND (:fromDate IS NULL OR b.observedAt >= :fromDate) " +
           "AND (:toDate IS NULL OR b.observedAt <= :toDate) " +
           "ORDER BY b.observedAt DESC")
    List<BiomarkerObservationEntity> findFiltered(
        @Param("patientId") UUID patientId,
        @Param("testName") String testName,
        @Param("loincCode") String loincCode,
        @Param("status") VerificationStatus status,
        @Param("fromDate") Instant fromDate,
        @Param("toDate") Instant toDate
    );

    @Query("SELECT b FROM BiomarkerObservationEntity b WHERE b.patient.id = :patientId " +
           "AND b.verificationStatus = 'VERIFIED' " +
           "ORDER BY b.testName ASC, b.observedAt ASC")
    List<BiomarkerObservationEntity> findVerifiedForTrends(@Param("patientId") UUID patientId);

    List<BiomarkerObservationEntity> findByReportId(UUID reportId);
}
