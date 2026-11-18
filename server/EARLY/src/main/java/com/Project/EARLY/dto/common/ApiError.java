package com.Project.EARLY.dto.common;

import java.util.List;

public record ApiError(
    String code,
    String message,
    List<Object> details
) {
    public ApiError(String code, String message) {
        this(code, message, List.of());
    }
}
