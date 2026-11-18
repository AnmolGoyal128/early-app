package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.FollowUpEntity;
import com.Project.EARLY.dto.followup.FollowUpRecordDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FollowUpMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientName", source = "patient.user.fullName")
    @Mapping(target = "doctorId", source = "doctor.id")
    @Mapping(target = "doctorName", source = "doctor.user.fullName")
    @Mapping(target = "clinicId", source = "clinic.id")
    @Mapping(target = "signalFlagId", source = "signalFlag.id")
    @Mapping(target = "encounterId", source = "encounter.id")
    FollowUpRecordDto toDto(FollowUpEntity followUp);
}
