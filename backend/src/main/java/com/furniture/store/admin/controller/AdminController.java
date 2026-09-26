package com.furniture.store.admin.controller;

import com.furniture.store.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
@Tag(name = "Admin", description = "Administrative operations restricted to ADMIN role")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard overview metrics (ADMIN only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = Map.of(
                "totalSales", 452300.0,
                "totalOrders", 124,
                "activeProducts", 85,
                "pendingFulfillments", 7
        );
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Get admin inventory management overview (ADMIN only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInventoryOverview() {
        Map<String, Object> inventory = Map.of(
                "warehouseLocations", 3,
                "criticalLowStockItems", 2,
                "totalStockUnits", 1430
        );
        return ResponseEntity.ok(ApiResponse.ok(inventory));
    }
}
