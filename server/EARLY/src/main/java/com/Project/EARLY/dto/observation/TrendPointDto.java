package com.Project.EARLY.dto.observation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TrendPointDto(
    Instant observedAt,
    BigDecimal valueNumeric,
    boolean isAbnormal,
    UUID observationId
) {}
