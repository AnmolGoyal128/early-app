package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.dto.patient.PatientSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PatientMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "phone", source = "user.phone")
    @Mapping(target = "isSyntheticDemo", source = "syntheticDemo")
    PatientSummaryDto toSummaryDto(PatientEntity patient);
}
