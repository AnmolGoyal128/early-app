package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.ClinicalEncounterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClinicalEncounterRepository extends JpaRepository<ClinicalEncounterEntity, UUID> {
    List<ClinicalEncounterEntity> findByPatientIdOrderByEncounterDateDesc(UUID patientId);
}
