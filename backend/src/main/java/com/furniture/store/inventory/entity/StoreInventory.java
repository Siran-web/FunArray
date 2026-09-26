package com.furniture.store.inventory.entity;

import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "store_inventory")
public class StoreInventory {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private PhysicalStore store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(nullable = false)
    private Integer reserved = 0;

    @Column(nullable = false)
    private Integer available = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public StoreInventory() {}

    public StoreInventory(String id, PhysicalStore store, Product product, ProductVariant variant, Integer quantity) {
        this.id = id;
        this.store = store;
        this.product = product;
        this.variant = variant;
        this.quantity = quantity != null ? quantity : 0;
        this.reserved = 0;
        this.available = this.quantity;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public PhysicalStore getStore() { return store; }
    public void setStore(PhysicalStore store) { this.store = store; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public ProductVariant getVariant() { return variant; }
    public void setVariant(ProductVariant variant) { this.variant = variant; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) {
        this.quantity = quantity != null ? quantity : 0;
        this.available = Math.max(0, this.quantity - this.reserved);
        this.updatedAt = Instant.now();
    }
    public Integer getReserved() { return reserved; }
    public void setReserved(Integer reserved) {
        this.reserved = reserved != null ? reserved : 0;
        this.available = Math.max(0, this.quantity - this.reserved);
        this.updatedAt = Instant.now();
    }
    public Integer getAvailable() { return available; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
