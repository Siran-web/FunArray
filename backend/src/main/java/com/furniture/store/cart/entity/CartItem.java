package com.furniture.store.cart.entity;

import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public CartItem() {}

    public CartItem(String id, Cart cart, Product product, ProductVariant variant, Integer quantity, BigDecimal unitPrice) {
        this.id = id;
        this.cart = cart;
        this.product = product;
        this.variant = variant;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Cart getCart() { return cart; }
    public void setCart(Cart cart) { this.cart = cart; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public ProductVariant getVariant() { return variant; }
    public void setVariant(ProductVariant variant) { this.variant = variant; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
