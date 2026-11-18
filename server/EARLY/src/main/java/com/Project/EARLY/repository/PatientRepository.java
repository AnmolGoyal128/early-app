package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.PatientEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<PatientEntity, UUID> {
    Optional<PatientEntity> findByUserId(UUID userId);

    @Query("SELECT DISTINCT p FROM PatientEntity p " +
           "JOIN p.consents c " +
           "JOIN p.user u " +
           "WHERE c.clinic.id = :clinicId AND c.status = 'ACTIVE' " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PatientEntity> findAuthorizedPatients(@Param("clinicId") UUID clinicId, 
                                               @Param("search") String search, 
                                               Pageable pageable);

    @Query("SELECT DISTINCT p FROM PatientEntity p " +
           "JOIN p.consents c " +
           "JOIN p.user u " +
           "WHERE c.clinic.id = :clinicId AND c.status = 'ACTIVE' " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<PatientEntity> findAuthorizedPatientsList(@Param("clinicId") UUID clinicId, 
                                                   @Param("search") String search);
}
