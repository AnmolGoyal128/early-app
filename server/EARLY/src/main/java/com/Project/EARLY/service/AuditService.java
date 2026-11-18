package com.Project.EARLY.service;

import com.Project.EARLY.dto.governance.AuditLogDto;
import com.Project.EARLY.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface AuditService {
    void logAccess(UserPrincipal actor, String action, String resourceType, UUID resourceId, HttpServletRequest request, Map<String, Object> metadata);
    void logEvent(UUID actorUserId, String actorRole, String action, String resourceType, UUID resourceId, String ipAddress, Map<String, Object> metadata);
    Page<AuditLogDto> getAuditLogs(UserPrincipal actor, Pageable pageable);
}
