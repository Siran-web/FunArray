package com.furniture.store.health;

import com.furniture.store.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthCheckController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealthStatus() {
        Map<String, Object> status = Map.of(
                "status", "UP",
                "service", "virtual-furniture-store-api",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "capabilities", Map.of(
                        "ecommerce", "READY",
                        "arPreview", "READY",
                        "omnichannelStore", "READY"
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(status));
    }
}
