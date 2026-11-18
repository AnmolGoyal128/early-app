package com.Project.EARLY.repository;

import com.Project.EARLY.domain.entity.PreventiveRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PreventiveRuleRepository extends JpaRepository<PreventiveRuleEntity, UUID> {
    List<PreventiveRuleEntity> findByIsActiveTrue();
    Optional<PreventiveRuleEntity> findByRuleCode(String ruleCode);
}
