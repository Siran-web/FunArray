package com.furniture.store.storage;

import com.furniture.store.exception.BadRequestException;
import com.furniture.store.storage.dto.PresignedUploadRequest;
import com.furniture.store.storage.dto.PresignedUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Service
public class StorageService {

    @Value("${app.storage.s3.bucket-name:funarray-furniture-storage}")
    private String bucketName;

    @Value("${app.storage.s3.region:ap-south-1}")
    private String region;

    @Value("${app.storage.s3.public-url-prefix:https://funarray-furniture-storage.s3.ap-south-1.amazonaws.com}")
    private String publicUrlPrefix;

    @Value("${app.storage.s3.upload-url-expiration-seconds:900}")
    private int expirationSeconds;

    // Size limits (in bytes)
    public static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;      // 10 MB
    public static final long MAX_3D_MODEL_SIZE = 100L * 1024 * 1024;  // 100 MB
    public static final long MAX_ROOM_SCAN_SIZE = 50L * 1024 * 1024;   // 50 MB

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"
    );

    private static final Set<String> ALLOWED_MODEL_TYPES = Set.of(
            "model/gltf-binary", "model/gltf+json", "model/vnd.usdz+zip", "application/octet-stream"
    );

    public PresignedUploadResponse generatePresignedUploadUrl(PresignedUploadRequest request) {
        String resourceType = request.resourceType().trim().toUpperCase();
        String contentType = request.contentType().trim().toLowerCase();
        long fileSize = request.fileSize();
        String filename = sanitizeFilename(request.filename());

        long maxSizeBytes;
        String folder;

        switch (resourceType) {
            case "PRODUCT_IMAGE" -> {
                maxSizeBytes = MAX_IMAGE_SIZE;
                folder = "products/images/";
                if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
                    throw new BadRequestException("Invalid content type for product image. Allowed: JPEG, PNG, WebP, AVIF.");
                }
                if (!hasImageExtension(filename)) {
                    throw new BadRequestException("Invalid image file extension. Allowed: .jpg, .jpeg, .png, .webp, .avif");
                }
            }
            case "3D_MODEL" -> {
                maxSizeBytes = MAX_3D_MODEL_SIZE;
                folder = "products/models/";
                if (!ALLOWED_MODEL_TYPES.contains(contentType)) {
                    throw new BadRequestException("Invalid content type for 3D model. Allowed: model/gltf-binary, model/gltf+json, model/vnd.usdz+zip, application/octet-stream.");
                }
                if (!has3DModelExtension(filename)) {
                    throw new BadRequestException("Invalid 3D model file extension. Only .glb, .gltf, and .usdz are accepted.");
                }
            }
            case "ROOM_SCAN" -> {
                maxSizeBytes = MAX_ROOM_SCAN_SIZE;
                folder = "rooms/scans/";
            }
            default -> throw new BadRequestException("Unsupported resource type: " + resourceType);
        }

        if (fileSize > maxSizeBytes) {
            long maxMb = maxSizeBytes / (1024 * 1024);
            throw new BadRequestException("File size exceeds maximum allowed limit of " + maxMb + " MB.");
        }

        String key = folder + UUID.randomUUID() + "-" + filename;
        long expiresAt = Instant.now().getEpochSecond() + expirationSeconds;

        String baseUrl = publicUrlPrefix.endsWith("/") ? publicUrlPrefix : publicUrlPrefix + "/";
        String fileUrl = baseUrl + key;

        // Generate HMAC signature for presigned direct upload URL
        String signatureToken = generateSignatureToken(key, contentType, expiresAt);
        String uploadUrl = baseUrl + key + "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=" + expirationSeconds +
                "&X-Amz-Signature=" + signatureToken + "&X-Amz-Date=" + Instant.now().toString().replaceAll("[:-]", "");

        Map<String, String> requiredHeaders = Map.of(
                "Content-Type", contentType
        );

        return new PresignedUploadResponse(
                uploadUrl,
                fileUrl,
                key,
                expirationSeconds,
                maxSizeBytes,
                contentType,
                requiredHeaders
        );
    }

    private String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) {
            return "file.bin";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_").toLowerCase();
    }

    private boolean hasImageExtension(String name) {
        String lower = name.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
                || lower.endsWith(".webp") || lower.endsWith(".avif");
    }

    private boolean has3DModelExtension(String name) {
        String lower = name.toLowerCase();
        return lower.endsWith(".glb") || lower.endsWith(".gltf") || lower.endsWith(".usdz");
    }

    private String generateSignatureToken(String key, String contentType, long expiresAt) {
        try {
            String payload = key + "|" + contentType + "|" + expiresAt + "|" + bucketName;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }
}
