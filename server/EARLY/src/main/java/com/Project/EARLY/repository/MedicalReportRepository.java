package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.MedicalReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReportEntity, UUID> {
    List<MedicalReportEntity> findByPatientIdOrderByReportDateDesc(UUID patientId);
    Optional<MedicalReportEntity> findByFileSha256(String fileSha256);
}
