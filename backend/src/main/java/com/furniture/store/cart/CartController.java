package com.furniture.store.cart;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.cart.dto.*;
import com.furniture.store.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/cart", "/api/cart"})
@Tag(name = "Cart", description = "Shopping cart endpoints with authoritative price and real-time inventory validation")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current user's shopping cart")
    public ResponseEntity<ApiResponse<CartDto>> getCart(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CartDto cart = cartService.getCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(cart));
    }

    @PostMapping("/items")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Add an item to cart (validated against authoritative price & stock)")
    public ResponseEntity<ApiResponse<CartDto>> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CartDto cart = cartService.addToCart(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(cart));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update line item quantity in cart")
    public ResponseEntity<ApiResponse<CartDto>> updateCartItem(
            @PathVariable String itemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CartDto cart = cartService.updateCartItem(principal.getId(), itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(cart));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Remove an item from cart")
    public ResponseEntity<ApiResponse<CartDto>> removeCartItem(
            @PathVariable String itemId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CartDto cart = cartService.removeCartItem(principal.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.ok(cart));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Clear all items from shopping cart")
    public ResponseEntity<ApiResponse<Map<String, String>>> clearCart(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Cart cleared successfully")));
    }
}
