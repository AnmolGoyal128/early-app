package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.EarlySignalFlagEntity;
import com.Project.EARLY.domain.enums.RuleSeverity;
import com.Project.EARLY.domain.enums.SignalSeverity;
import com.Project.EARLY.dto.signal.EarlySignalFlagDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EarlySignalMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientName", source = "patient.user.fullName")
    @Mapping(target = "ruleCode", source = "rule.ruleCode")
    @Mapping(target = "ruleTitle", source = "rule.name")
    @Mapping(target = "observationId", source = "observation.id")
    @Mapping(target = "severity", expression = "java(mapSeverity(entity.getRule() != null ? entity.getRule().getSeverity() : null))")
    @Mapping(target = "reviewedByDoctorId", source = "reviewedByDoctor.id")
    @Mapping(target = "flaggedAt", source = "createdAt")
    EarlySignalFlagDto toDoctorDto(EarlySignalFlagEntity entity);

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientName", source = "patient.user.fullName")
    @Mapping(target = "ruleCode", ignore = true)
    @Mapping(target = "ruleTitle", constant = "Health Indicator Review")
    @Mapping(target = "observationId", source = "observation.id")
    @Mapping(target = "clinicianMessage", ignore = true)
    @Mapping(target = "clinicianNote", ignore = true)
    @Mapping(target = "patientMessage", source = "patientMessage")
    @Mapping(target = "severity", expression = "java(mapSeverity(entity.getRule() != null ? entity.getRule().getSeverity() : null))")
    @Mapping(target = "reviewedByDoctorId", source = "reviewedByDoctor.id")
    @Mapping(target = "flaggedAt", source = "createdAt")
    EarlySignalFlagDto toPatientDto(EarlySignalFlagEntity entity);

    default SignalSeverity mapSeverity(RuleSeverity severity) {
        if (severity == null) return SignalSeverity.LOW;
        return switch (severity) {
            case INFO -> SignalSeverity.LOW;
            case REVIEW_NEEDED -> SignalSeverity.MEDIUM;
            case PRIORITY -> SignalSeverity.HIGH;
        };
    }
}
