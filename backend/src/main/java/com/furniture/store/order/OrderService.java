package com.furniture.store.order;

import com.furniture.store.cart.CartService;
import com.furniture.store.cart.dto.CartDto;
import com.furniture.store.cart.dto.CartItemDto;
import com.furniture.store.cart.entity.Cart;
import com.furniture.store.cart.entity.CartItem;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.inventory.InventoryService;
import com.furniture.store.inventory.dto.InventoryCheckResult;
import com.furniture.store.inventory.dto.StockItemRequest;
import com.furniture.store.order.dto.*;
import com.furniture.store.order.entity.Order;
import com.furniture.store.order.entity.OrderItem;
import com.furniture.store.order.repository.OrderItemRepository;
import com.furniture.store.order.repository.OrderRepository;
import com.furniture.store.product.entity.ProductImage;
import com.furniture.store.user.dto.AddressDto;
import com.furniture.store.user.entity.Address;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.AddressRepository;
import com.furniture.store.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class OrderService {

    public static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("500.00");
    public static final BigDecimal STANDARD_SHIPPING_FEE = new BigDecimal("29.99");
    public static final BigDecimal TAX_RATE = new BigDecimal("0.08"); // 8% sales tax

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CartService cartService;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            CartService cartService,
            AddressRepository addressRepository,
            UserRepository userRepository,
            InventoryService inventoryService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.cartService = cartService;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    /**
     * TICKET-025: Server-authoritative checkout preview with calculated subtotal, shipping, tax & discounts.
     */
    @Transactional(readOnly = true)
    public CheckoutPreviewResponse previewCheckout(String userId, String shippingAddressId, String couponCode) {
        CartDto cart = cartService.getCart(userId);

        if (cart.items() == null || cart.items().isEmpty()) {
            return new CheckoutPreviewResponse(
                    Collections.emptyList(),
                    0,
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    null,
                    false,
                    FREE_SHIPPING_THRESHOLD
            );
        }

        // Revalidate stock availability for all cart items
        for (CartItemDto item : cart.items()) {
            InventoryCheckResult check = inventoryService.checkAvailability(item.variantId(), item.quantity());
            if (!check.inStock()) {
                throw new InsufficientInventoryException(
                        item.variantSku(),
                        check.availableQuantity(),
                        item.quantity()
                );
            }
        }

        BigDecimal subtotal = cart.subtotal().setScale(2, RoundingMode.HALF_UP);
        boolean eligibleForFreeShipping = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0;
        BigDecimal shippingFee = eligibleForFreeShipping ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : STANDARD_SHIPPING_FEE;
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = calculateDiscount(couponCode, subtotal);
        BigDecimal totalAmount = subtotal.add(shippingFee).add(tax).subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        AddressDto addressDto = null;
        if (shippingAddressId != null && !shippingAddressId.isBlank()) {
            Address address = addressRepository.findByIdAndUserId(shippingAddressId, userId)
                    .orElse(null);
            if (address != null) {
                addressDto = AddressDto.fromEntity(address);
            }
        }

        return new CheckoutPreviewResponse(
                cart.items(),
                cart.totalItems(),
                subtotal,
                shippingFee,
                tax,
                discount,
                totalAmount,
                addressDto,
                eligibleForFreeShipping,
                FREE_SHIPPING_THRESHOLD
        );
    }

    /**
     * TICKET-025: Authoritative order checkout flow.
     * 1. Validates user & shipping address.
     * 2. Retrieves items from cart.
     * 3. Revalidates and locks inventory atomically.
     * 4. Calculates all totals strictly on server.
     * 5. Creates Order & OrderItem records.
     * 6. Commits inventory deduction.
     * 7. Empties cart.
     */
    public OrderDto processCheckout(String userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // 1. Validate shipping address
        Address shippingAddress = addressRepository.findByIdAndUserId(request.shippingAddressId(), userId)
                .orElseThrow(() -> new BadRequestException("Valid shipping address is required for checkout"));

        // 2. Retrieve active cart
        Cart cart = cartRepository.findByUserIdAndStatus(userId, "ACTIVE")
                .orElseThrow(() -> new BadRequestException("No active cart found for checkout"));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart");
        }

        // 3. Atomically lock & reserve inventory
        List<StockItemRequest> stockRequests = cartItems.stream()
                .map(item -> new StockItemRequest(item.getVariant().getId(), item.getQuantity()))
                .toList();

        try {
            inventoryService.reserveInventory(stockRequests);
        } catch (InsufficientInventoryException e) {
            throw e;
        }

        // 4. Server-authoritative cost calculations
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            BigDecimal authoritativePrice = item.getVariant().getPrice() != null ?
                    item.getVariant().getPrice() : item.getProduct().getBasePrice();
            BigDecimal lineTotal = authoritativePrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal shippingFee = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ?
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : STANDARD_SHIPPING_FEE;
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = calculateDiscount(request.couponCode(), subtotal);
        BigDecimal totalAmount = subtotal.add(shippingFee).add(tax).subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        // 5. Generate Order Number & create Order entity
        String orderNumber = "ORD-" + Instant.now().toEpochMilli() + "-" + String.format("%04d", new Random().nextInt(10000));
        String orderId = UUID.randomUUID().toString();

        Order order = new Order(
                orderId,
                user,
                orderNumber,
                "CONFIRMED",
                subtotal,
                shippingFee,
                tax,
                discount,
                totalAmount,
                shippingAddress
        );

        // 6. Create OrderItems attached to Order
        for (CartItem item : cartItems) {
            BigDecimal unitPrice = item.getVariant().getPrice() != null ?
                    item.getVariant().getPrice() : item.getProduct().getBasePrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);

            OrderItem orderItem = new OrderItem(
                    UUID.randomUUID().toString(),
                    order,
                    item.getProduct(),
                    item.getVariant(),
                    item.getProduct().getName(),
                    item.getQuantity(),
                    unitPrice,
                    lineTotal
            );
            order.getItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // 7. Commit inventory reservation
        inventoryService.commitReservation(stockRequests);

        // 8. Clear user cart
        cartItemRepository.deleteByCartId(cart.getId());

        return toDto(savedOrder, savedOrder.getItems());
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrders(String userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(order -> {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            return toDto(order, items);
        }).toList();
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> getUserOrdersPaged(String userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(order -> {
                    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                    return toDto(order, items);
                });
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(String orderId, String userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        return toDto(order, items);
    }

    public OrderDto cancelOrder(String orderId, String userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Order is already cancelled");
        }
        if ("DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Delivered orders cannot be cancelled");
        }

        order.setStatus("CANCELLED");
        order.setUpdatedAt(Instant.now());
        Order updated = orderRepository.save(order);

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        return toDto(updated, items);
    }

    // ==================== Helper Methods ====================

    private BigDecimal calculateDiscount(String couponCode, BigDecimal subtotal) {
        if (couponCode == null || couponCode.isBlank()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        String normalizedCode = couponCode.trim().toUpperCase();
        if ("WELCOME10".equals(normalizedCode)) {
            return subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        } else if ("SAVE20".equals(normalizedCode)) {
            return subtotal.multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
        } else if ("FLAT50".equals(normalizedCode)) {
            return new BigDecimal("50.00").min(subtotal).setScale(2, RoundingMode.HALF_UP);
        }

        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private OrderDto toDto(Order order, List<OrderItem> items) {
        List<OrderItemDto> itemDtos = items != null ? items.stream().map(item -> {
            String imageUrl = "";
            if (item.getProduct() != null && item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()) {
                imageUrl = item.getProduct().getImages().get(0).getImageUrl();
            }

            return new OrderItemDto(
                    item.getId(),
                    item.getProduct() != null ? item.getProduct().getId() : null,
                    item.getProductName(),
                    item.getProduct() != null ? item.getProduct().getSlug() : "",
                    item.getVariant() != null ? item.getVariant().getId() : null,
                    item.getVariant() != null ? item.getVariant().getSku() : "",
                    item.getVariant() != null ? item.getVariant().getColor() : "",
                    item.getVariant() != null ? item.getVariant().getMaterial() : "",
                    imageUrl,
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getTotalPrice()
            );
        }).toList() : Collections.emptyList();

        AddressDto addressDto = order.getShippingAddress() != null ?
                AddressDto.fromEntity(order.getShippingAddress()) : null;

        return new OrderDto(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getSubtotal(),
                order.getShippingFee(),
                order.getTax(),
                order.getDiscount(),
                order.getTotalAmount(),
                addressDto,
                itemDtos,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
