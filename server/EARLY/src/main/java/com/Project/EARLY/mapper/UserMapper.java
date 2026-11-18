package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.UserEntity;
import com.Project.EARLY.dto.auth.UserProfileDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "doctorId", source = "doctor.id")
    @Mapping(target = "clinicId", source = "doctor.clinic.id")
    @Mapping(target = "clinicName", source = "doctor.clinic.name")
    @Mapping(target = "specialization", source = "doctor.specialization")
    @Mapping(target = "medicalRegNumber", source = "doctor.medicalRegNumber")
    @Mapping(target = "isActive", source = "active")
    UserProfileDto toProfileDto(UserEntity user);
}
