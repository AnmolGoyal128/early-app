package com.Project.EARLY.controller;

import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.encounter.CreateEncounterRequest;
import com.Project.EARLY.dto.encounter.EncounterRecordDto;
import com.Project.EARLY.dto.encounter.TreatmentRecordDto;
import com.Project.EARLY.dto.encounter.UpdateTreatmentStatusRequest;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.EncounterService;
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
public class EncounterController {

    private final EncounterService encounterService;

    @GetMapping("/patients/{patientId}/encounters")
    public ResponseEntity<ApiResponse<List<EncounterRecordDto>>> getPatientEncounters(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<EncounterRecordDto> encounters = encounterService.getEncountersForPatient(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(encounters));
    }

    @PostMapping("/patients/{patientId}/encounters")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN')")
    public ResponseEntity<ApiResponse<EncounterRecordDto>> createEncounter(
            @PathVariable UUID patientId,
            @Valid @RequestBody CreateEncounterRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        EncounterRecordDto encounter = encounterService.createEncounter(patientId, request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(encounter));
    }

    @GetMapping("/patients/{patientId}/treatments")
    public ResponseEntity<ApiResponse<List<TreatmentRecordDto>>> getPatientTreatments(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<TreatmentRecordDto> treatments = encounterService.getTreatmentsForPatient(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(treatments));
    }

    @PatchMapping("/treatments/{treatmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN')")
    public ResponseEntity<ApiResponse<TreatmentRecordDto>> updateTreatmentStatus(
            @PathVariable UUID treatmentId,
            @Valid @RequestBody UpdateTreatmentStatusRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        TreatmentRecordDto treatment = encounterService.updateTreatmentStatus(treatmentId, request, actor);
        return ResponseEntity.ok(ApiResponse.success(treatment));
    }
}
