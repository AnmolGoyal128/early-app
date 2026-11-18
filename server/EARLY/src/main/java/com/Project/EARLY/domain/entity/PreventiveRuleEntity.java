package com.Project.EARLY.domain.entity;

import com.Project.EARLY.domain.enums.RuleCategory;
import com.Project.EARLY.domain.enums.RuleSeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "preventive_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreventiveRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rule_code", nullable = false, unique = true, length = 60)
    private String ruleCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RuleCategory category;

    @Column(name = "rule_definition_json", nullable = false, columnDefinition = "TEXT")
    private String ruleDefinitionJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RuleSeverity severity;

    @Column(name = "clinician_message_template", nullable = false, columnDefinition = "TEXT")
    private String clinicianMessageTemplate;

    @Column(name = "patient_message_template", nullable = false, columnDefinition = "TEXT")
    private String patientMessageTemplate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
