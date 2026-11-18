package com.Project.EARLY.controller;

import com.Project.EARLY.domain.enums.VerificationStatus;
import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.observation.BiomarkerObservationDto;
import com.Project.EARLY.dto.observation.BiomarkerTrendDto;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.ObservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/observations")
@RequiredArgsConstructor
public class ObservationController {

    private final ObservationService observationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BiomarkerObservationDto>>> getObservations(
            @PathVariable UUID patientId,
            @RequestParam(required = false) String testName,
            @RequestParam(required = false) String loincCode,
            @RequestParam(required = false) VerificationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @AuthenticationPrincipal UserPrincipal actor) {

        List<BiomarkerObservationDto> observations = observationService.getObservations(
                patientId, testName, loincCode, status, fromDate, toDate, actor
        );
        return ResponseEntity.ok(ApiResponse.success(observations));
    }

    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<List<BiomarkerTrendDto>>> getTrends(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<BiomarkerTrendDto> trends = observationService.getTrends(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(trends));
    }
}
