package com.Project.EARLY.controller;

import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.governance.AuditLogDto;
import com.Project.EARLY.dto.governance.CorrectionRequestDto;
import com.Project.EARLY.dto.governance.CreateCorrectionRequest;
import com.Project.EARLY.dto.governance.UpdateCorrectionStatusRequest;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.CorrectionRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
public class GovernanceController {

    private final CorrectionRequestService correctionRequestService;
    private final AuditService auditService;

    @PostMapping("/correction-requests")
    public ResponseEntity<ApiResponse<CorrectionRequestDto>> createCorrectionRequest(
            @Valid @RequestBody CreateCorrectionRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        CorrectionRequestDto created = correctionRequestService.createCorrectionRequest(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/correction-requests")
    public ResponseEntity<ApiResponse<List<CorrectionRequestDto>>> getCorrectionRequests(
            @AuthenticationPrincipal UserPrincipal actor) {
        List<CorrectionRequestDto> requests = correctionRequestService.getCorrectionRequests(actor);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PatchMapping("/correction-requests/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<CorrectionRequestDto>> updateCorrectionStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCorrectionStatusRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        CorrectionRequestDto updated = correctionRequestService.updateCorrectionStatus(id, request, actor);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getAuditLogs(
            @AuthenticationPrincipal UserPrincipal actor,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLogDto> page = auditService.getAuditLogs(actor, pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent()));
    }
}
