package com.Project.EARLY.service;

import com.Project.EARLY.dto.governance.CorrectionRequestDto;
import com.Project.EARLY.dto.governance.CreateCorrectionRequest;
import com.Project.EARLY.dto.governance.UpdateCorrectionStatusRequest;
import com.Project.EARLY.security.UserPrincipal;

import java.util.List;
import java.util.UUID;

public interface CorrectionRequestService {
    CorrectionRequestDto createCorrectionRequest(CreateCorrectionRequest request, UserPrincipal actor);
    List<CorrectionRequestDto> getCorrectionRequests(UserPrincipal actor);
    CorrectionRequestDto updateCorrectionStatus(UUID id, UpdateCorrectionStatusRequest request, UserPrincipal actor);
}
