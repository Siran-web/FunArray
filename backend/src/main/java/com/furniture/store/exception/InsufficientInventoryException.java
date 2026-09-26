package com.furniture.store.exception;

public class InsufficientInventoryException extends RuntimeException {
    private final String variantId;
    private final int available;
    private final int requested;

    public InsufficientInventoryException(String message) {
        super(message);
        this.variantId = null;
        this.available = 0;
        this.requested = 0;
    }

    public InsufficientInventoryException(String variantId, int available, int requested) {
        super(String.format("Insufficient inventory for variant '%s': requested %d, but only %d available", variantId, requested, available));
        this.variantId = variantId;
        this.available = available;
        this.requested = requested;
    }

    public String getVariantId() { return variantId; }
    public int getAvailable() { return available; }
    public int getRequested() { return requested; }
}
