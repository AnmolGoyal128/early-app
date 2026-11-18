package com.Project.EARLY.service;

import com.Project.EARLY.domain.enums.VerificationStatus;
import com.Project.EARLY.dto.observation.BiomarkerObservationDto;
import com.Project.EARLY.dto.observation.BiomarkerTrendDto;
import com.Project.EARLY.security.UserPrincipal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ObservationService {
    List<BiomarkerObservationDto> getObservations(
            UUID patientId,
            String testName,
            String loincCode,
            VerificationStatus status,
            Instant fromDate,
            Instant toDate,
            UserPrincipal actor
    );

    List<BiomarkerTrendDto> getTrends(UUID patientId, UserPrincipal actor);
}
