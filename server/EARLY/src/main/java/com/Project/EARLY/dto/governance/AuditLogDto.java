package com.Project.EARLY.dto.governance;

import java.time.Instant;
import java.util.UUID;

public record AuditLogDto(
    UUID id,
    UUID actorUserId,
    String actorName,
    String actorRole,
    String action,
    String resourceType,
    UUID resourceId,
    String metadataJson,
    String ipAddress,
    Instant timestamp
) {}
