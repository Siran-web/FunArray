package com.furniture.store.admin;

import com.furniture.store.common.ApiResponse;
import com.furniture.store.order.OrderService;
import com.furniture.store.order.dto.OrderDto;
import com.furniture.store.order.dto.UpdateOrderStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/orders", "/api/admin/orders"})
@Tag(name = "Admin Orders", description = "Administrative order management, fulfillment, and state transitions")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'STORE_MANAGER', 'STORE_STAFF')")
@SecurityRequirement(name = "bearerAuth")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Get all customer orders (paginated)")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getAllOrders(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<OrderDto> orders = orderService.getAllOrdersPaged(pageable);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order details by ID (Admin)")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(@PathVariable String orderId) {
        OrderDto order = orderService.getAdminOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update order status with legal transition enforcement (TICKET-028)")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        OrderDto order = orderService.updateOrderStatus(orderId, request.status());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PatchMapping("/{orderId}/status")
    @Operation(summary = "Update order status with legal transition enforcement (TICKET-028)")
    public ResponseEntity<ApiResponse<OrderDto>> patchOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        OrderDto order = orderService.updateOrderStatus(orderId, request.status());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }
}
