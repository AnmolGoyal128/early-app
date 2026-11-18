package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.EarlySignalFlagEntity;
import com.Project.EARLY.domain.enums.SignalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EarlySignalFlagRepository extends JpaRepository<EarlySignalFlagEntity, UUID> {
    List<EarlySignalFlagEntity> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<EarlySignalFlagEntity> findByPatientIdAndStatus(UUID patientId, SignalStatus status);
    long countByPatientIdAndStatus(UUID patientId, SignalStatus status);
}
