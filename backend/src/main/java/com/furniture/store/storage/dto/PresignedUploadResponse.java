package com.furniture.store.storage.dto;

import java.util.Map;

public record PresignedUploadResponse(
        String uploadUrl,
        String fileUrl,
        String key,
        int expiresInSeconds,
        long maxSizeBytes,
        String contentType,
        Map<String, String> requiredHeaders
) {}
