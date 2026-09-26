package com.furniture.store.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        ErrorDetails error,
        Instant timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, Instant.now());
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, data, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ErrorDetails(code, message, null), Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message, Map<String, String> fieldErrors) {
        return new ApiResponse<>(false, null, new ErrorDetails(code, message, fieldErrors), Instant.now());
    }

    public record ErrorDetails(
            String code,
            String message,
            Map<String, String> fieldErrors
    ) {}
}
