package com.furniture.store.order;

import com.furniture.store.cart.CartService;
import com.furniture.store.cart.entity.Cart;
import com.furniture.store.cart.entity.CartItem;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.inventory.InventoryService;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.order.dto.CheckoutRequest;
import com.furniture.store.order.dto.OrderDto;
import com.furniture.store.order.entity.Order;
import com.furniture.store.order.entity.OrderItem;
import com.furniture.store.order.repository.OrderItemRepository;
import com.furniture.store.order.repository.OrderRepository;
import com.furniture.store.payment.repository.PaymentRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.user.entity.Address;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.AddressRepository;
import com.furniture.store.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceUnitTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private PaymentRepository paymentRepository;

    private OrderService orderService;
    private User sampleUser;
    private Address sampleAddress;
    private Cart sampleCart;
    private Product sampleProduct;
    private ProductVariant sampleVariant;
    private CartItem sampleCartItem;
    private Order sampleOrder;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        InventoryService inventoryService = new InventoryService(inventoryRepository, productVariantRepository);
        CartService cartService = new CartService(
                cartRepository,
                cartItemRepository,
                productRepository,
                productVariantRepository,
                userRepository,
                inventoryService
        );

        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                cartRepository,
                cartItemRepository,
                cartService,
                addressRepository,
                userRepository,
                inventoryService,
                paymentRepository
        );

        sampleUser = new User("customer@funarray.com", "hash", "Alex", "Smith", "+919876543210", null, null);
        sampleUser.setId("user-1");

        sampleAddress = new Address(sampleUser, "123 MG Road", "Suite 4B", "Bangalore", "Karnataka", "560001", "India", true);

        sampleCart = new Cart("cart-1", sampleUser);

        sampleProduct = new Product();
        sampleProduct.setId("prod-1");
        sampleProduct.setName("Oak Dining Table");
        sampleProduct.setBasePrice(new BigDecimal("799.00"));

        sampleVariant = new ProductVariant();
        sampleVariant.setId("var-1");
        sampleVariant.setSku("TBL-OAK-NAT");
        sampleVariant.setPrice(new BigDecimal("799.00"));
        sampleVariant.setProduct(sampleProduct);

        sampleInventory = new Inventory("inv-1", sampleProduct, sampleVariant, 10);

        sampleCartItem = new CartItem("item-1", sampleCart, sampleProduct, sampleVariant, 1, new BigDecimal("799.00"));

        sampleOrder = new Order(
                "order-1", sampleUser, "ORD-123456", "CONFIRMED",
                new BigDecimal("799.00"), BigDecimal.ZERO, new BigDecimal("63.92"),
                BigDecimal.ZERO, new BigDecimal("862.92"), sampleAddress
        );
    }

    @Test
    @DisplayName("Unit: processCheckout creates order, commits reservation and clears cart")
    void processCheckout_Success() {
        CheckoutRequest request = new CheckoutRequest("addr-1", "CARD", "Please ring doorbell", null);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByIdAndUserId("addr-1", "user-1")).thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdAndStatus("user-1", "ACTIVE")).thenReturn(Optional.of(sampleCart));
        when(cartItemRepository.findByCartId("cart-1")).thenReturn(List.of(sampleCartItem));
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantIdWithLock("var-1")).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(sampleInventory);
        when(orderRepository.save(any(Order.class))).thenReturn(sampleOrder);

        OrderDto orderDto = orderService.processCheckout("user-1", request);

        assertThat(orderDto).isNotNull();
        assertThat(orderDto.id()).isEqualTo("order-1");
        assertThat(orderDto.orderNumber()).isEqualTo("ORD-123456");
        verify(cartItemRepository).deleteByCartId("cart-1");
    }

    @Test
    @DisplayName("Unit: processCheckout throws BadRequestException on empty cart")
    void processCheckout_EmptyCart() {
        CheckoutRequest request = new CheckoutRequest("addr-1", "CARD", null, null);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByIdAndUserId("addr-1", "user-1")).thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdAndStatus("user-1", "ACTIVE")).thenReturn(Optional.of(sampleCart));
        when(cartItemRepository.findByCartId("cart-1")).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> orderService.processCheckout("user-1", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot checkout with an empty cart");
    }

    @Test
    @DisplayName("Unit: updateOrderStatus enforces legal status transitions")
    void updateOrderStatus_ValidTransition() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(sampleOrder);

        OrderDto result = orderService.updateOrderStatus("order-1", "PROCESSING");

        assertThat(result).isNotNull();
        assertThat(sampleOrder.getStatus()).isEqualTo("PROCESSING");
    }

    @Test
    @DisplayName("Unit: updateOrderStatus rejects illegal status transition")
    void updateOrderStatus_IllegalTransition() {
        sampleOrder.setStatus("CONFIRMED");
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.updateOrderStatus("order-1", "DELIVERED"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid status transition");
    }
}
