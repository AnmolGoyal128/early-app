package com.Project.EARLY.service;

import com.Project.EARLY.dto.followup.ClinicDashboardSummaryDto;
import com.Project.EARLY.dto.followup.CreateFollowUpRequest;
import com.Project.EARLY.dto.followup.FollowUpRecordDto;
import com.Project.EARLY.dto.followup.UpdateFollowUpStatusRequest;
import com.Project.EARLY.security.UserPrincipal;

import java.util.List;
import java.util.UUID;

public interface FollowUpService {
    List<FollowUpRecordDto> getFollowUpsForPatient(UUID patientId, UserPrincipal actor);
    FollowUpRecordDto createFollowUp(CreateFollowUpRequest request, UserPrincipal actor);
    FollowUpRecordDto updateFollowUpStatus(UUID followUpId, UpdateFollowUpStatusRequest request, UserPrincipal actor);
    List<FollowUpRecordDto> getClinicFollowUps(UserPrincipal actor);
    ClinicDashboardSummaryDto getClinicDashboardSummary(UserPrincipal actor);
}
