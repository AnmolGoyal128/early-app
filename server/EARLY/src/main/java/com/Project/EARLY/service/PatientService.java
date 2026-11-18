package com.Project.EARLY.service;

import com.Project.EARLY.dto.patient.PatientSummaryDto;
import com.Project.EARLY.dto.patient.TimelineItemDto;
import com.Project.EARLY.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface PatientService {
    PatientSummaryDto getPatientSummary(UUID patientId, UserPrincipal actor);
    PatientSummaryDto getCurrentPatientSummary(UserPrincipal actor);
    List<PatientSummaryDto> searchAuthorizedPatients(String query, UserPrincipal actor);
    Page<PatientSummaryDto> searchAuthorizedPatientsPaged(String query, UserPrincipal actor, Pageable pageable);
    List<TimelineItemDto> getPatientTimeline(UUID patientId, String fromDate, String toDate, String type, UserPrincipal actor);
}
