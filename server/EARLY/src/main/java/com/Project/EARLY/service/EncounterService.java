package com.Project.EARLY.service;

import com.Project.EARLY.dto.encounter.CreateEncounterRequest;
import com.Project.EARLY.dto.encounter.EncounterRecordDto;
import com.Project.EARLY.dto.encounter.TreatmentRecordDto;
import com.Project.EARLY.dto.encounter.UpdateTreatmentStatusRequest;
import com.Project.EARLY.security.UserPrincipal;

import java.util.List;
import java.util.UUID;

public interface EncounterService {
    List<EncounterRecordDto> getEncountersForPatient(UUID patientId, UserPrincipal actor);
    EncounterRecordDto createEncounter(UUID patientId, CreateEncounterRequest request, UserPrincipal actor);
    List<TreatmentRecordDto> getTreatmentsForPatient(UUID patientId, UserPrincipal actor);
    TreatmentRecordDto updateTreatmentStatus(UUID treatmentId, UpdateTreatmentStatusRequest request, UserPrincipal actor);
}
