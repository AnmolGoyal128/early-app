package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.PatientConsentEntity;
import com.Project.EARLY.dto.consent.ConsentRecordDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConsentMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "clinicId", source = "clinic.id")
    @Mapping(target = "clinicName", source = "clinic.name")
    @Mapping(target = "doctorId", source = "doctor.id")
    @Mapping(target = "doctorName", source = "doctor.user.fullName")
    ConsentRecordDto toDto(PatientConsentEntity consent);
}
