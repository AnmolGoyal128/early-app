package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.CorrectionRequestEntity;
import com.Project.EARLY.dto.governance.CorrectionRequestDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CorrectionRequestMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientName", source = "patient.user.fullName")
    @Mapping(target = "observationId", source = "observation.id")
    @Mapping(target = "reportId", source = "report.id")
    @Mapping(target = "resolvedByUserId", source = "resolvedBy.id")
    CorrectionRequestDto toDto(CorrectionRequestEntity request);
}
