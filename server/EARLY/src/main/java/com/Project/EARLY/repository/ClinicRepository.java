package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.ClinicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ClinicRepository extends JpaRepository<ClinicEntity, UUID> {
}
