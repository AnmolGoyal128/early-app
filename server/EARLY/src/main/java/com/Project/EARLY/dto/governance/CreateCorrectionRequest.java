package com.Project.EARLY.dto.governance;

//import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateCorrectionRequest(
    UUID observationId,
    UUID reportId,
    
    String requestedChange
) {}
