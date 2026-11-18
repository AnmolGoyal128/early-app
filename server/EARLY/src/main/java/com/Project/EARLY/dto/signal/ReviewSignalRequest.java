package com.Project.EARLY.dto.signal;

import com.Project.EARLY.domain.enums.SignalStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewSignalRequest(
    @NotNull SignalStatus status,
    String clinicianNote
) {}
