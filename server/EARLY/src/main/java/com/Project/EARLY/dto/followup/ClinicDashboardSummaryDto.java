package com.Project.EARLY.dto.followup;

public record ClinicDashboardSummaryDto(
    long totalPatients,
    long followUpsDue,
    long followUpsOverdue,
    long followUpsCompleted,
    long patientsNeedingReview
) {}
