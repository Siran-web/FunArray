package com.furniture.store.inventory.entity;

import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false, unique = true)
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(nullable = false)
    private Integer reserved = 0;

    @Column(nullable = false)
    private Integer available = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Inventory() {}

    public Inventory(String id, Product product, ProductVariant variant, Integer quantity) {
        this.id = id;
        this.product = product;
        this.variant = variant;
        this.quantity = quantity != null ? quantity : 0;
        this.reserved = 0;
        this.available = this.quantity;
        this.updatedAt = Instant.now();
    }

    public void recalculateAvailable() {
        if (this.quantity < 0) {
            throw new BadRequestException("Inventory quantity cannot be negative");
        }
        if (this.reserved < 0) {
            throw new BadRequestException("Inventory reserved quantity cannot be negative");
        }
        this.available = this.quantity - this.reserved;
        if (this.available < 0) {
            throw new BadRequestException("Calculated available inventory cannot be negative");
        }
        this.updatedAt = Instant.now();
    }

    public void setQuantity(Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new BadRequestException("Inventory quantity cannot be negative");
        }
        if (quantity < this.reserved) {
            throw new BadRequestException(String.format("New quantity (%d) cannot be less than currently reserved quantity (%d)", quantity, this.reserved));
        }
        this.quantity = quantity;
        recalculateAvailable();
    }

    public void reserve(int count) {
        if (count <= 0) {
            throw new BadRequestException("Reservation count must be positive");
        }
        if (this.available < count) {
            throw new InsufficientInventoryException(
                    variant != null ? variant.getSku() : id,
                    this.available,
                    count
            );
        }
        this.reserved += count;
        recalculateAvailable();
    }

    public void releaseReservation(int count) {
        if (count <= 0) {
            throw new BadRequestException("Release count must be positive");
        }
        this.reserved = Math.max(0, this.reserved - count);
        recalculateAvailable();
    }

    public void commitReservation(int count) {
        if (count <= 0) {
            throw new BadRequestException("Commit count must be positive");
        }
        if (this.reserved < count || this.quantity < count) {
            throw new BadRequestException("Cannot commit more than reserved/total quantity");
        }
        this.reserved -= count;
        this.quantity -= count;
        recalculateAvailable();
    }

    public void adjustStock(int adjustment) {
        int newQuantity = this.quantity + adjustment;
        if (newQuantity < 0) {
            throw new BadRequestException("Adjusted inventory quantity cannot be negative");
        }
        if (newQuantity < this.reserved) {
            throw new BadRequestException(String.format("Adjusted quantity (%d) cannot be less than currently reserved quantity (%d)", newQuantity, this.reserved));
        }
        this.quantity = newQuantity;
        recalculateAvailable();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public ProductVariant getVariant() { return variant; }
    public void setVariant(ProductVariant variant) { this.variant = variant; }
    public Integer getQuantity() { return quantity; }
    public Integer getReserved() { return reserved; }
    public void setReserved(Integer reserved) {
        this.reserved = reserved != null ? reserved : 0;
        recalculateAvailable();
    }
    public Integer getAvailable() { return available; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
