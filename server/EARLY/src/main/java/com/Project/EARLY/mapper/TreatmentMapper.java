package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.TreatmentEntity;
import com.Project.EARLY.dto.encounter.TreatmentRecordDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TreatmentMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "encounterId", source = "encounter.id")
    @Mapping(target = "doctorId", source = "doctor.id")
    TreatmentRecordDto toDto(TreatmentEntity treatment);
}
