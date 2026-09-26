package com.furniture.store.cart;

import com.furniture.store.cart.dto.*;
import com.furniture.store.cart.entity.Cart;
import com.furniture.store.cart.entity.CartItem;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.inventory.InventoryService;
import com.furniture.store.inventory.dto.InventoryCheckResult;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductImage;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            ProductVariantRepository productVariantRepository,
            UserRepository userRepository,
            InventoryService inventoryService
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    public Cart getOrCreateCart(String userId) {
        return cartRepository.findByUserIdAndStatus(userId, "ACTIVE")
                .orElseGet(() -> {
                    User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
                    Cart cart = new Cart(UUID.randomUUID().toString(), user);
                    return cartRepository.save(cart);
                });
    }

    @Transactional(readOnly = true)
    public CartDto getCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        return toDto(cart);
    }

    /**
     * Add a product variant to cart with server-authoritative price and inventory validation.
     */
    public CartDto addToCart(String userId, AddToCartRequest request) {
        if (request.quantity() <= 0) {
            throw new BadRequestException("Quantity must be at least 1");
        }

        Cart cart = getOrCreateCart(userId);

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.productId()));

        ProductVariant variant;
        if (request.variantId() != null && !request.variantId().isBlank()) {
            variant = productVariantRepository.findById(request.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + request.variantId()));
        } else {
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
            if (variants.isEmpty()) {
                throw new BadRequestException("No available variants for product: " + product.getName());
            }
            variant = variants.get(0);
        }

        // Check if item already in cart
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId());
        int targetQuantity = request.quantity();
        if (existingItemOpt.isPresent()) {
            targetQuantity += existingItemOpt.get().getQuantity();
        }

        // TICKET-017 & TICKET-023: Authoritative Inventory Availability Enforcement
        InventoryCheckResult check = inventoryService.checkAvailability(variant.getId(), targetQuantity);
        if (!check.inStock()) {
            throw new InsufficientInventoryException(
                    variant.getSku(),
                    check.availableQuantity(),
                    targetQuantity
            );
        }

        // Authoritative price directly from variant / product
        BigDecimal authoritativePrice = variant.getPrice() != null ? variant.getPrice() : product.getBasePrice();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(targetQuantity);
            existingItem.setUnitPrice(authoritativePrice);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem(
                    UUID.randomUUID().toString(),
                    cart,
                    product,
                    variant,
                    request.quantity(),
                    authoritativePrice
            );
            cartItemRepository.save(newItem);
        }

        return getCart(userId);
    }

    public CartDto updateCartItem(String userId, String itemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("Cart item not found in current cart");
        }

        if (request.quantity() <= 0) {
            cartItemRepository.delete(item);
            return getCart(userId);
        }

        // Check inventory
        InventoryCheckResult check = inventoryService.checkAvailability(item.getVariant().getId(), request.quantity());
        if (!check.inStock()) {
            throw new InsufficientInventoryException(
                    item.getVariant().getSku(),
                    check.availableQuantity(),
                    request.quantity()
            );
        }

        item.setQuantity(request.quantity());
        cartItemRepository.save(item);

        return getCart(userId);
    }

    public CartDto removeCartItem(String userId, String itemId) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (item.getCart().getId().equals(cart.getId())) {
            cartItemRepository.delete(item);
        }

        return getCart(userId);
    }

    public void clearCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
    }

    // ==================== DTO Mapping ====================

    private CartDto toDto(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<CartItemDto> itemDtos = items.stream().map(item -> {
            String imageUrl = "";
            if (item.getProduct() != null && item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()) {
                imageUrl = item.getProduct().getImages().get(0).getImageUrl();
            }

            BigDecimal unitPrice = item.getUnitPrice();
            BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

            return new CartItemDto(
                    item.getId(),
                    item.getProduct().getId(),
                    item.getProduct().getName(),
                    item.getProduct().getSlug(),
                    item.getVariant().getId(),
                    item.getVariant().getSku(),
                    item.getVariant().getColor(),
                    item.getVariant().getMaterial(),
                    imageUrl,
                    item.getQuantity(),
                    unitPrice,
                    totalPrice
            );
        }).toList();

        int totalItems = itemDtos.stream().mapToInt(CartItemDto::quantity).sum();
        BigDecimal subtotal = itemDtos.stream()
                .map(CartItemDto::totalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartDto(
                cart.getId(),
                cart.getUser() != null ? cart.getUser().getId() : null,
                cart.getStatus(),
                itemDtos,
                totalItems,
                subtotal
        );
    }
}
