package com.Project.EARLY.controller;

import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.followup.ClinicDashboardSummaryDto;
import com.Project.EARLY.dto.followup.CreateFollowUpRequest;
import com.Project.EARLY.dto.followup.FollowUpRecordDto;
import com.Project.EARLY.dto.followup.UpdateFollowUpStatusRequest;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.FollowUpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FollowUpController {

    private final FollowUpService followUpService;

    @GetMapping("/patients/{patientId}/follow-ups")
    public ResponseEntity<ApiResponse<List<FollowUpRecordDto>>> getPatientFollowUps(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<FollowUpRecordDto> followUps = followUpService.getFollowUpsForPatient(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(followUps));
    }

    @PostMapping("/patients/{patientId}/follow-ups")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<FollowUpRecordDto>> createFollowUp(
            @PathVariable UUID patientId,
            @Valid @RequestBody CreateFollowUpRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        FollowUpRecordDto followUp = followUpService.createFollowUp(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(followUp));
    }

    @PatchMapping("/follow-ups/{followUpId}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<FollowUpRecordDto>> updateFollowUpStatus(
            @PathVariable UUID followUpId,
            @Valid @RequestBody UpdateFollowUpStatusRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        FollowUpRecordDto followUp = followUpService.updateFollowUpStatus(followUpId, request, actor);
        return ResponseEntity.ok(ApiResponse.success(followUp));
    }

    @GetMapping("/clinic/follow-ups")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<FollowUpRecordDto>>> getClinicFollowUps(
            @AuthenticationPrincipal UserPrincipal actor) {
        List<FollowUpRecordDto> followUps = followUpService.getClinicFollowUps(actor);
        return ResponseEntity.ok(ApiResponse.success(followUps));
    }

    @GetMapping("/clinic/dashboard/summary")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ClinicDashboardSummaryDto>> getClinicDashboardSummary(
            @AuthenticationPrincipal UserPrincipal actor) {
        ClinicDashboardSummaryDto summary = followUpService.getClinicDashboardSummary(actor);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
