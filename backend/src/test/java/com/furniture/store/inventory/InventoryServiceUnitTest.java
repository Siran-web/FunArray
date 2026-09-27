package com.furniture.store.inventory;

import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.inventory.dto.InventoryCheckResult;
import com.furniture.store.inventory.dto.ReservationResponseDto;
import com.furniture.store.inventory.dto.StockItemRequest;
import com.furniture.store.inventory.dto.UpdateStockRequest;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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
public class InventoryServiceUnitTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product sampleProduct;
    private ProductVariant sampleVariant;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        sampleProduct = new Product();
        sampleProduct.setId("prod-1");
        sampleProduct.setName("Oak Table");

        sampleVariant = new ProductVariant();
        sampleVariant.setId("var-1");
        sampleVariant.setSku("TBL-OAK-NAT");
        sampleVariant.setProduct(sampleProduct);
        sampleVariant.setStockQuantity(25);
        sampleVariant.setPrice(new BigDecimal("499.99"));

        sampleInventory = new Inventory("inv-1", sampleProduct, sampleVariant, 25);
    }

    @Test
    @DisplayName("Unit: checkAvailability returns inStock=true when available >= requested")
    void checkAvailability_InStock() {
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantId("var-1")).thenReturn(Optional.of(sampleInventory));

        InventoryCheckResult result = inventoryService.checkAvailability("var-1", 5);

        assertThat(result.inStock()).isTrue();
        assertThat(result.availableQuantity()).isEqualTo(25);
        assertThat(result.requestedQuantity()).isEqualTo(5);
    }

    @Test
    @DisplayName("Unit: checkAvailability returns inStock=false when available < requested")
    void checkAvailability_OutOfStock() {
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantId("var-1")).thenReturn(Optional.of(sampleInventory));

        InventoryCheckResult result = inventoryService.checkAvailability("var-1", 30);

        assertThat(result.inStock()).isFalse();
        assertThat(result.availableQuantity()).isEqualTo(25);
    }

    @Test
    @DisplayName("Unit: reserveInventory reserves quantity when available")
    void reserveInventory_Success() {
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantIdWithLock("var-1")).thenReturn(Optional.of(sampleInventory));

        ReservationResponseDto response = inventoryService.reserveInventory(List.of(new StockItemRequest("var-1", 5)));

        assertThat(response.success()).isTrue();
        assertThat(sampleInventory.getReserved()).isEqualTo(5);
        assertThat(sampleInventory.getAvailable()).isEqualTo(20);
        verify(inventoryRepository).save(sampleInventory);
    }

    @Test
    @DisplayName("Unit: reserveInventory throws InsufficientInventoryException when insufficient")
    void reserveInventory_Insufficient() {
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantIdWithLock("var-1")).thenReturn(Optional.of(sampleInventory));

        assertThatThrownBy(() -> inventoryService.reserveInventory(List.of(new StockItemRequest("var-1", 50))))
                .isInstanceOf(InsufficientInventoryException.class);
    }

    @Test
    @DisplayName("Unit: updateStock sets stock quantity and synchronizes variant")
    void updateStock_Success() {
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(sampleVariant));
        when(inventoryRepository.findByVariantId("var-1")).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(sampleInventory);

        inventoryService.updateStock("var-1", new UpdateStockRequest(50));

        assertThat(sampleInventory.getQuantity()).isEqualTo(50);
        assertThat(sampleVariant.getStockQuantity()).isEqualTo(50);
        verify(productVariantRepository).save(sampleVariant);
    }
}
