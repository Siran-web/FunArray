package com.furniture.store.cart;

import com.furniture.store.cart.dto.AddToCartRequest;
import com.furniture.store.cart.dto.CartDto;
import com.furniture.store.cart.entity.Cart;
import com.furniture.store.cart.entity.CartItem;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.inventory.InventoryService;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartServiceUnitTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    private CartService cartService;
    private User sampleUser;
    private Cart sampleCart;
    private Product sampleProduct;
    private ProductVariant sampleVariant;
    private CartItem sampleCartItem;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        InventoryService inventoryService = new InventoryService(inventoryRepository, productVariantRepository);
        cartService = new CartService(
                cartRepository,
                cartItemRepository,
                productRepository,
                productVariantRepository,
                userRepository,
                inventoryService
        );

        sampleUser = new User("user@example.com", "hash", "Jane", "Doe", null, null, null);
        sampleUser.setId("user-1");

        sampleCart = new Cart("cart-1", sampleUser);

        sampleProduct = new Product();
        sampleProduct.setId("prod-1");
        sampleProduct.setName("Modern Velvet Sofa");
        sampleProduct.setBasePrice(new BigDecimal("899.99"));

        sampleVariant = new ProductVariant();
        sampleVariant.setId("var-1");
        sampleVariant.setSku("SOFA-VEL-EMERALD");
        sampleVariant.setProduct(sampleProduct);
        sampleVariant.setPrice(new BigDecimal("899.99"));

        sampleInventory = new Inventory("inv-1", sampleProduct, sampleVariant, 10);

        sampleCartItem = new CartItem("item-1", sampleCart, sampleProduct, sampleVariant, 2, new BigDecimal("899.99"));
    }

    @Test
    @DisplayName("Unit: addToCart adds item when in stock")
    void addToCart_Success() {
        AddToCartRequest req = new AddToCartRequest("prod-1", "var-1", 1);

        when(cartRepository.findByUserIdAndStatus("user-1", "ACTIVE")).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(sampleProduct));
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantId("var-1")).thenReturn(Optional.of(sampleInventory));
        when(cartItemRepository.findByCartIdAndVariantId("cart-1", "var-1")).thenReturn(Optional.empty());
        when(cartItemRepository.findByCartId("cart-1")).thenReturn(List.of(sampleCartItem));

        CartDto result = cartService.addToCart("user-1", req);

        assertThat(result).isNotNull();
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    @DisplayName("Unit: addToCart throws BadRequestException when quantity <= 0")
    void addToCart_InvalidQuantity() {
        AddToCartRequest req = new AddToCartRequest("prod-1", "var-1", 0);

        assertThatThrownBy(() -> cartService.addToCart("user-1", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quantity must be at least 1");
    }

    @Test
    @DisplayName("Unit: addToCart throws InsufficientInventoryException when out of stock")
    void addToCart_OutOfStock() {
        AddToCartRequest req = new AddToCartRequest("prod-1", "var-1", 15);

        when(cartRepository.findByUserIdAndStatus("user-1", "ACTIVE")).thenReturn(Optional.of(sampleCart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(sampleProduct));
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantId("var-1")).thenReturn(Optional.of(sampleInventory));
        when(cartItemRepository.findByCartIdAndVariantId("cart-1", "var-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.addToCart("user-1", req))
                .isInstanceOf(InsufficientInventoryException.class);
    }

    @Test
    @DisplayName("Unit: clearCart removes all items for user cart")
    void clearCart_Success() {
        when(cartRepository.findByUserIdAndStatus("user-1", "ACTIVE")).thenReturn(Optional.of(sampleCart));

        cartService.clearCart("user-1");

        verify(cartItemRepository).deleteByCartId("cart-1");
    }
}
