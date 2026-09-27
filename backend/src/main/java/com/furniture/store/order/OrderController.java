package com.furniture.store.order;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.order.dto.OrderDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/orders", "/api/orders"})
@Tag(name = "Orders", description = "Customer order history and order management")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current user's order history")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getOrders(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<OrderDto> orders = orderService.getUserOrders(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/paged")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current user's order history with pagination")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getOrdersPaged(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<OrderDto> orders = orderService.getUserOrdersPaged(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get order details by order ID")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @PathVariable String orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        OrderDto order = orderService.getOrderById(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @PathVariable String orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        OrderDto order = orderService.cancelOrder(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'STORE_MANAGER', 'STORE_STAFF')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update order status with state-machine validation (TICKET-028)")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody com.furniture.store.order.dto.UpdateOrderStatusRequest request
    ) {
        OrderDto order = orderService.updateOrderStatus(orderId, request.status());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'STORE_MANAGER', 'STORE_STAFF')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update order status with state-machine validation (TICKET-028)")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatusPut(
            @PathVariable String orderId,
            @RequestBody com.furniture.store.order.dto.UpdateOrderStatusRequest request
    ) {
        OrderDto order = orderService.updateOrderStatus(orderId, request.status());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }
}
