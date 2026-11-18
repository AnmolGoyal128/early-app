package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.MedicalReportEntity;
import com.Project.EARLY.dto.report.MedicalReportDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {ObservationMapper.class})
public interface ReportMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "uploadedByUserId", source = "uploadedBy.id")
    @Mapping(target = "clinicId", source = "clinic.id")
    @Mapping(target = "observations", source = "observations")
    MedicalReportDto toDto(MedicalReportEntity report);
}
