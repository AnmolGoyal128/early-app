package com.Project.EARLY.dto.report;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record VerifyReportPayload(
    @NotNull List<VerifyObservationItem> observations
) {}
