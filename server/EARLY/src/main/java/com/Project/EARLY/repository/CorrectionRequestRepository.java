package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.CorrectionRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CorrectionRequestRepository extends JpaRepository<CorrectionRequestEntity, UUID> {
    List<CorrectionRequestEntity> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<CorrectionRequestEntity> findAllByOrderByCreatedAtDesc();
}
