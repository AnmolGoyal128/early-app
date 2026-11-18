package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.DoctorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorRepository extends JpaRepository<DoctorEntity, UUID> {
    Optional<DoctorEntity> findByUserId(UUID userId);
    List<DoctorEntity> findByClinicId(UUID clinicId);
}
