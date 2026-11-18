package com.Project.EARLY.dto.observation;

import java.math.BigDecimal;
import java.util.List;

public record BiomarkerTrendDto(
    String testName,
    String unit,
    BigDecimal referenceLow,
    BigDecimal referenceHigh,
    List<TrendPointDto> points
) {}
