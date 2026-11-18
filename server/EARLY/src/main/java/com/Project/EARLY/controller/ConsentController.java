package com.Project.EARLY.controller;

import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.consent.ConsentRecordDto;
import com.Project.EARLY.dto.consent.GrantConsentRequest;
import com.Project.EARLY.dto.consent.RevokeConsentResponse;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.ConsentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/consents")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentService consentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsentRecordDto>>> getMyConsents(
            @AuthenticationPrincipal UserPrincipal actor) {
        List<ConsentRecordDto> consents = consentService.listConsentsForPatient(actor.getPatientId());
        return ResponseEntity.ok(ApiResponse.success(consents));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConsentRecordDto>> grantConsent(
            @Valid @RequestBody GrantConsentRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        ConsentRecordDto created = consentService.grantConsent(actor, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PostMapping("/{consentId}/revoke")
    public ResponseEntity<ApiResponse<RevokeConsentResponse>> revokeConsent(
            @PathVariable UUID consentId,
            @AuthenticationPrincipal UserPrincipal actor) {
        consentService.revokeConsent(actor, consentId);
        RevokeConsentResponse response = new RevokeConsentResponse("REVOKED", Instant.now());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
