package com.furniture.store.order;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.order.dto.CheckoutPreviewResponse;
import com.furniture.store.order.dto.CheckoutRequest;
import com.furniture.store.order.dto.OrderDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/checkout", "/api/checkout"})
@Tag(name = "Checkout", description = "Checkout preview and order execution with server-authoritative calculations")
public class CheckoutController {

    private final OrderService orderService;

    public CheckoutController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/preview")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Preview checkout totals (server-side subtotal, tax, shipping, discount)")
    public ResponseEntity<ApiResponse<CheckoutPreviewResponse>> previewCheckout(
            @RequestParam(required = false) String shippingAddressId,
            @RequestParam(required = false) String couponCode,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CheckoutPreviewResponse preview = orderService.previewCheckout(principal.getId(), shippingAddressId, couponCode);
        return ResponseEntity.ok(ApiResponse.ok(preview));
    }

    @PostMapping("/preview")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Preview checkout totals via POST body")
    public ResponseEntity<ApiResponse<CheckoutPreviewResponse>> previewCheckoutPost(
            @RequestBody(required = false) CheckoutRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String shippingAddressId = request != null ? request.shippingAddressId() : null;
        String couponCode = request != null ? request.couponCode() : null;
        CheckoutPreviewResponse preview = orderService.previewCheckout(principal.getId(), shippingAddressId, couponCode);
        return ResponseEntity.ok(ApiResponse.ok(preview));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Execute checkout and create an order with inventory deduction and cart clearing")
    public ResponseEntity<ApiResponse<OrderDto>> processCheckout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        OrderDto order = orderService.processCheckout(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(order));
    }
}
