package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.domain.enums.FollowUpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUpEntity, UUID> {
    List<FollowUpEntity> findByPatientIdOrderByDueDateAsc(UUID patientId);
    List<FollowUpEntity> findByClinicIdOrderByDueDateAsc(UUID clinicId);
    List<FollowUpEntity> findByClinicIdAndStatusInOrderByDueDateAsc(UUID clinicId, Collection<FollowUpStatus> statuses);

    long countByClinicId(UUID clinicId);
    long countByClinicIdAndStatus(UUID clinicId, FollowUpStatus status);
    long countByClinicIdAndStatusInAndDueDateBefore(UUID clinicId, Collection<FollowUpStatus> statuses, LocalDate date);
    long countByPatientIdAndStatus(UUID patientId, FollowUpStatus status);

    List<FollowUpEntity> findByStatusAndDueDateBefore(FollowUpStatus status, LocalDate date);
}
