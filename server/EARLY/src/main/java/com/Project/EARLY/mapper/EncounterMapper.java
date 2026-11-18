package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.ClinicalEncounterEntity;
import com.Project.EARLY.dto.encounter.EncounterRecordDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {TreatmentMapper.class})
public interface EncounterMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "doctorId", source = "doctor.id")
    @Mapping(target = "doctorName", source = "doctor.user.fullName")
    @Mapping(target = "clinicId", source = "clinic.id")
    @Mapping(target = "clinicName", source = "clinic.name")
    @Mapping(target = "treatments", source = "treatments")
    EncounterRecordDto toDto(ClinicalEncounterEntity encounter);
}
