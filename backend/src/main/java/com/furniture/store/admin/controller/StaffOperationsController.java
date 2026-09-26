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
@RequestMapping({"/api/v1/staff", "/api/staff"})
@Tag(name = "Staff Operations", description = "Operational endpoints permitted for STAFF and ADMIN roles")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('STAFF', 'STORE_STAFF', 'STORE_MANAGER', 'ADMIN')")
public class StaffOperationsController {

    @GetMapping("/tasks")
    @Operation(summary = "Get support staff pending operational tasks")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStaffTasks() {
        Map<String, Object> tasks = Map.of(
                "assignedSupportTickets", 5,
                "showroomInquiries", 3,
                "status", "OPERATIONAL"
        );
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }
}
