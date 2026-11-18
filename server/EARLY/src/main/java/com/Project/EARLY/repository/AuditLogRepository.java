package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
    Page<AuditLogEntity> findByActorUserIdOrderByCreatedAtDesc(UUID actorUserId, Pageable pageable);
    Page<AuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLogEntity a WHERE a.actorUser.id = :userId " +
           "OR (a.resourceType = 'PATIENT' AND a.resourceId = :patientId) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLogEntity> findPatientVisibleLogs(
        @Param("userId") UUID userId,
        @Param("patientId") UUID patientId,
        Pageable pageable
    );
}
