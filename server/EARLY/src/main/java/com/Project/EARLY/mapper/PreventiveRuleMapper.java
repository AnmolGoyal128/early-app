package com.Project.EARLY.mapper;

import com.Project.EARLY.domain.entity.PreventiveRuleEntity;
import com.Project.EARLY.dto.signal.PreventiveRuleDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PreventiveRuleMapper {
    @Mapping(target = "isActive", source = "active")
    PreventiveRuleDto toDto(PreventiveRuleEntity rule);
}
