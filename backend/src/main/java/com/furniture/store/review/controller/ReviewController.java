package com.furniture.store.review.controller;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.review.dto.CreateReviewRequest;
import com.furniture.store.review.dto.ProductReviewSummaryDto;
import com.furniture.store.review.dto.ReviewDto;
import com.furniture.store.review.service.ReviewService;
import com.furniture.store.user.entity.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping
@Tag(name = "Product Reviews", description = "Submit and view customer product reviews and ratings (TICKET-031)")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping({"/api/v1/products/{productId}/reviews", "/api/products/{productId}/reviews"})
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a product review (TICKET-031)")
    public ResponseEntity<ApiResponse<ReviewDto>> createReview(
            @PathVariable String productId,
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ReviewDto review = reviewService.createReview(principal.getId(), productId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(review));
    }

    @GetMapping({"/api/v1/products/{productId}/reviews", "/api/products/{productId}/reviews"})
    @Operation(summary = "Get published reviews for a product (TICKET-031)")
    public ResponseEntity<ApiResponse<ProductReviewSummaryDto>> getProductReviews(
            @PathVariable String productId
    ) {
        ProductReviewSummaryDto summary = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @DeleteMapping({"/api/v1/reviews/{id}", "/api/reviews/{id}"})
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a review")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteReview(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        reviewService.deleteReview(id, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Review deleted successfully")));
    }

    @PatchMapping({"/api/v1/reviews/{id}/status", "/api/reviews/{id}/status"})
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Moderate review status (ADMIN only)")
    public ResponseEntity<ApiResponse<ReviewDto>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.getOrDefault("status", "PUBLISHED");
        ReviewDto review = reviewService.updateReviewStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(review));
    }
}
