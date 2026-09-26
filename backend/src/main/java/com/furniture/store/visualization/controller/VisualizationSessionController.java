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
@RequestMapping({"/api/v1/visualization/sessions", "/api/visualization/sessions"})
@Tag(name = "Visualization Sessions", description = "Save and retrieve interactive 3D furniture layout sessions")
public class VisualizationSessionController {

    private final VisualizationService visualizationService;

    public VisualizationSessionController(VisualizationService visualizationService) {
        this.visualizationService = visualizationService;
    }

    @PostMapping
    @Operation(summary = "Save or persist a 3D visualization scene session")
    public ResponseEntity<ApiResponse<VisualizationSessionDto>> saveSession(
            @Valid @RequestBody SaveSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String userId = principal != null ? principal.getId() : null;
        VisualizationSessionDto session = visualizationService.saveSession(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(session));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List saved visualization scenes for current user")
    public ResponseEntity<ApiResponse<List<VisualizationSessionDto>>> getUserSessions(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VisualizationSessionDto> sessions = visualizationService.getUserSessions(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve a visualization session by ID")
    public ResponseEntity<ApiResponse<VisualizationSessionDto>> getSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String userId = principal != null ? principal.getId() : null;
        VisualizationSessionDto session = visualizationService.getSession(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(session));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a visualization session by ID")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        visualizationService.deleteSession(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Session deleted successfully")));
    }
}
