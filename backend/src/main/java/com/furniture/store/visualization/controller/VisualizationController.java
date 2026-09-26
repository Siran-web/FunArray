package com.furniture.store.visualization.controller;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.visualization.dto.*;
import com.furniture.store.visualization.service.VisualizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/rooms", "/api/rooms"})
@Tag(name = "Room Visualization", description = "Room image background uploads and 3D visualization scene persistence")
public class VisualizationController {

    private final VisualizationService visualizationService;

    public VisualizationController(VisualizationService visualizationService) {
        this.visualizationService = visualizationService;
    }

    /**
     * Upload / record a user room background image.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Register an uploaded room background image")
    public ResponseEntity<ApiResponse<RoomImageDto>> createRoomImage(
            @Valid @RequestBody CreateRoomImageRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RoomImageDto dto = visualizationService.createRoomImage(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(dto));
    }

    /**
     * Get all room images belonging to the authenticated user.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List room images for the current user")
    public ResponseEntity<ApiResponse<List<RoomImageDto>>> getUserRoomImages(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<RoomImageDto> images = visualizationService.getUserRoomImages(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(images));
    }

    /**
     * Get a specific room image by ID (verifying user ownership).
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get a room image by ID")
    public ResponseEntity<ApiResponse<RoomImageDto>> getRoomImage(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RoomImageDto dto = visualizationService.getRoomImage(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    /**
     * Delete a room image by ID (verifying user ownership).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a room image by ID")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteRoomImage(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        visualizationService.deleteRoomImage(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Room image deleted successfully")));
    }
}
