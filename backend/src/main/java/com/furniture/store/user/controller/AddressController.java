package com.furniture.store.user.controller;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.user.dto.AddressDto;
import com.furniture.store.user.dto.CreateAddressRequest;
import com.furniture.store.user.dto.UpdateAddressRequest;
import com.furniture.store.user.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/addresses")
@Tag(name = "Addresses", description = "Endpoints for managing customer shipping addresses")
@SecurityRequirement(name = "bearerAuth")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    @Operation(summary = "Get all shipping addresses for authenticated user")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<AddressDto> addresses = addressService.getUserAddresses(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(addresses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific shipping address by ID")
    public ResponseEntity<ApiResponse<AddressDto>> getAddressById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id
    ) {
        AddressDto address = addressService.getAddressById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(address));
    }

    @PostMapping
    @Operation(summary = "Create a new shipping address")
    public ResponseEntity<ApiResponse<AddressDto>> createAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateAddressRequest request
    ) {
        AddressDto created = addressService.createAddress(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing shipping address")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id,
            @Valid @RequestBody UpdateAddressRequest request
    ) {
        AddressDto updated = addressService.updateAddress(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shipping address")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id
    ) {
        addressService.deleteAddress(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Address deleted successfully")));
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Set address as default shipping address")
    public ResponseEntity<ApiResponse<AddressDto>> setDefaultAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id
    ) {
        AddressDto updated = addressService.setDefaultAddress(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
