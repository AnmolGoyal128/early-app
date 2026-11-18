package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.TreatmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TreatmentRepository extends JpaRepository<TreatmentEntity, UUID> {
    List<TreatmentEntity> findByPatientIdOrderByStartDateDesc(UUID patientId);
    List<TreatmentEntity> findByEncounterId(UUID encounterId);
}
