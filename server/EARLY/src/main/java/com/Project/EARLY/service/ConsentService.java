package com.Project.EARLY.service;

import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.dto.consent.ConsentRecordDto;
import com.Project.EARLY.dto.consent.GrantConsentRequest;
import com.Project.EARLY.security.UserPrincipal;

import java.util.List;
import java.util.UUID;

public interface ConsentService {
    void assertAccess(UserPrincipal actor, UUID patientId, ConsentScope requiredScope);
    boolean hasActiveConsent(UUID patientId, UUID clinicId, UUID doctorId, ConsentScope requiredScope);
    ConsentRecordDto grantConsent(UserPrincipal actor, GrantConsentRequest request);
    void revokeConsent(UserPrincipal actor, UUID consentId);
    List<ConsentRecordDto> listConsentsForPatient(UUID patientId);
    List<ConsentRecordDto> listConsentsForClinic(UUID clinicId);
}
