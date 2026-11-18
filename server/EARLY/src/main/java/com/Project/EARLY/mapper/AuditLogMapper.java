package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.AuditLogEntity;
import com.Project.EARLY.dto.governance.AuditLogDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(target = "actorUserId", source = "actorUser.id")
    @Mapping(target = "actorName", source = "actorUser.fullName")
    @Mapping(target = "timestamp", source = "createdAt")
    AuditLogDto toDto(AuditLogEntity log);
}
