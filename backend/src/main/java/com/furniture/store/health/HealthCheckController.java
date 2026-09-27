package com.furniture.store.health;

import com.furniture.store.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthCheckController {

    private final DataSource dataSource;

    public HealthCheckController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealthStatus() {
        boolean dbHealthy = checkDatabaseHealth();

        Map<String, Object> components = new HashMap<>();
        components.put("database", Map.of(
                "status", dbHealthy ? "UP" : "DOWN"
        ));
        components.put("storage", Map.of(
                "status", "UP",
                "provider", "S3"
        ));
        components.put("ecommerce", Map.of("status", "UP"));
        components.put("arPreview", Map.of("status", "UP"));

        Map<String, Object> status = Map.of(
                "status", dbHealthy ? "UP" : "DEGRADED",
                "service", "virtual-furniture-store-api",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "components", components
        );

        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }
}
