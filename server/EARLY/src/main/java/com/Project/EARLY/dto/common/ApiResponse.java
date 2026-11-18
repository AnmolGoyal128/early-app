package com.Project.EARLY.dto.common;

import java.time.Instant;
import java.util.List;

public record ApiResponse<T>(
    boolean success,
    T data,
    ApiError error,
    Instant timestamp
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message, List.of()), Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message, List<Object> details) {
        return new ApiResponse<>(false, null, new ApiError(code, message, details != null ? details : List.of()), Instant.now());
    }
}
