package com.Project.EARLY.controller;

import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.signal.EarlySignalFlagDto;
import com.Project.EARLY.dto.signal.PreventiveRuleDto;
import com.Project.EARLY.dto.signal.ReviewSignalRequest;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.EarlySignalEngine;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RuleSignalController {

    private final EarlySignalEngine earlySignalEngine;

    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<PreventiveRuleDto>>> getActiveRules() {
        List<PreventiveRuleDto> rules = earlySignalEngine.getActiveRules();
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/patients/{patientId}/signals")
    public ResponseEntity<ApiResponse<List<EarlySignalFlagDto>>> getSignalsForPatient(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<EarlySignalFlagDto> signals = earlySignalEngine.getSignalsForPatient(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(signals));
    }

    @PostMapping("/signals/{signalId}/review")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN')")
    public ResponseEntity<ApiResponse<EarlySignalFlagDto>> reviewSignal(
            @PathVariable UUID signalId,
            @Valid @RequestBody ReviewSignalRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        EarlySignalFlagDto reviewed = earlySignalEngine.reviewSignal(signalId, request, actor);
        return ResponseEntity.ok(ApiResponse.success(reviewed));
    }
}
