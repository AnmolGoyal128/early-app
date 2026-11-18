package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.dto.observation.BiomarkerObservationDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ObservationMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "reportId", source = "report.id")
    @Mapping(target = "sourceReportId", source = "report.id")
    @Mapping(target = "encounterId", source = "encounter.id")
    @Mapping(target = "verifiedByUserId", source = "verifiedBy.id")
    BiomarkerObservationDto toDto(BiomarkerObservationEntity observation);
}
