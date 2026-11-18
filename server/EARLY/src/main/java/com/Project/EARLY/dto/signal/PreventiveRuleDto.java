package com.Project.EARLY.dto.signal;

import com.Project.EARLY.domain.enums.RuleCategory;
import com.Project.EARLY.domain.enums.RuleSeverity;

import java.util.UUID;

public record PreventiveRuleDto(
    UUID id,
    String ruleCode,
    String name,
    RuleCategory category,
    String ruleDefinitionJson,
    RuleSeverity severity,
    String clinicianMessageTemplate,
    String patientMessageTemplate,
    boolean isActive
) {}
