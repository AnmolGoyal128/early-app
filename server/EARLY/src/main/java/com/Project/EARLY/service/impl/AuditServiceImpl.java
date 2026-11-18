package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.AuditLogEntity;
import com.Project.EARLY.domain.entity.UserEntity;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.dto.governance.AuditLogDto;
import com.Project.EARLY.mapper.AuditLogMapper;
import com.Project.EARLY.repository.AuditLogRepository;
import com.Project.EARLY.repository.UserRepository;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Override
    @Transactional
    public void logAccess(UserPrincipal actor, String action, String resourceType, UUID resourceId, HttpServletRequest request, Map<String, Object> metadata) {
        String ip = extractClientIp(request);
        logEvent(actor.getId(), actor.getRole().name(), action, resourceType, resourceId, ip, metadata);
    }

    @Override
    @Transactional
    public void logEvent(UUID actorUserId, String actorRole, String action, String resourceType, UUID resourceId, String ipAddress, Map<String, Object> metadata) {
        try {
            UserEntity user = userRepository.findById(actorUserId).orElse(null);
            if (user == null) {
                log.warn("Cannot audit log for non-existent user: {}", actorUserId);
                return;
            }

            String metaJson = null;
            if (metadata != null && !metadata.isEmpty()) {
                metaJson = objectMapper.writeValueAsString(metadata);
            }

            AuditLogEntity logEntity = AuditLogEntity.builder()
                    .actorUser(user)
                    .actorRole(actorRole)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId != null ? resourceId : user.getId())
                    .metadataJson(metaJson)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(logEntity);
        } catch (Exception e) {
            log.error("Failed to persist immutable audit log", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(UserPrincipal actor, Pageable pageable) {
        if (actor.getRole() == UserRole.PATIENT) {
            return auditLogRepository.findPatientVisibleLogs(actor.getId(), actor.getPatientId(), pageable)
                    .map(auditLogMapper::toDto);
        } else if (actor.getRole() == UserRole.CLINIC_ADMIN || actor.getRole() == UserRole.DOCTOR || actor.getRole() == UserRole.STAFF) {
            return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                    .map(auditLogMapper::toDto);
        }
        return auditLogRepository.findByActorUserIdOrderByCreatedAtDesc(actor.getId(), pageable)
                .map(auditLogMapper::toDto);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
