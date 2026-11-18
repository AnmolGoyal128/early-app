package com.Project.EARLY.controller;

import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.patient.PatientSummaryDto;
import com.Project.EARLY.dto.patient.TimelineItemDto;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PatientSummaryDto>> getCallerPatientSummary(
            @AuthenticationPrincipal UserPrincipal actor) {
        PatientSummaryDto summary = patientService.getCurrentPatientSummary(actor);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PatientSummaryDto>>> searchPatients(
            @RequestParam(required = false) String q,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<PatientSummaryDto> patients = patientService.searchAuthorizedPatients(q, actor);
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<ApiResponse<PatientSummaryDto>> getPatientById(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        PatientSummaryDto patient = patientService.getPatientSummary(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    @GetMapping("/{patientId}/timeline")
    public ResponseEntity<ApiResponse<List<TimelineItemDto>>> getPatientTimeline(
            @PathVariable UUID patientId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<TimelineItemDto> timeline = patientService.getPatientTimeline(patientId, fromDate, toDate, type, actor);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }
}
