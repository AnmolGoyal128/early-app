package com.Project.EARLY.dto.patient;

public record TimelineItemDto(
    String id,
    String type,
    String title,
    String subtitle,
    String date,
    String status,
    Object details
) {}
