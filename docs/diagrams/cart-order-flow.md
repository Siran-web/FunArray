# Cart, Checkout, and Order Flow Diagram

This diagram displays the full commerce journey: adding to cart, managing line items, entering multi-step checkout, validating shipping and discounts, reserving inventory, executing payment, and creating the final order.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant CartUI as Cart Page / Drawer (/cart)
    participant CheckoutUI as Checkout Page (/checkout)
    participant OrderUI as Orders Page (/orders/[id])
    participant OrderAPI as orderApi / cartApi
    participant CheckoutController as CheckoutController
    participant OrderService as OrderService
    participant InventoryService as InventoryService
    participant PaymentService as PaymentService
    participant DB as PostgreSQL / MySQL

    User->>CartUI: Review items and click "Proceed to Checkout"
    CartUI->>CheckoutUI: Navigate to /checkout
    CheckoutUI->>OrderAPI: orderApi.previewCheckout(shippingAddressId, couponCode)
    OrderAPI->>CheckoutController: GET /api/v1/checkout/preview
    CheckoutController->>OrderService: previewCheckout(userId, addressId, coupon)
    OrderService->>DB: Calculate server-authoritative subtotal, tax (18%), shipping fee, discount
    DB-->>OrderService: Return computed line items
    OrderService-->>CheckoutUI: CheckoutPreviewResponse (subtotal, tax, shipping, discount, totalAmount)

    User->>CheckoutUI: Step 1: Select/Add Shipping Address
    User->>CheckoutUI: Step 2: Select Payment Method (Razorpay / Credit Card / UPI)
    User->>CheckoutUI: Step 3: Click "Place Order"

    CheckoutUI->>OrderAPI: orderApi.checkout({shippingAddressId, paymentMethod, couponCode})
    OrderAPI->>CheckoutController: POST /api/v1/checkout
    CheckoutController->>OrderService: processCheckout(userId, request)

    critical Pessimistic Stock Reservation & Order Creation
        OrderService->>InventoryService: reserveInventory(cartItems)
        InventoryService->>DB: UPDATE inventory SET reserved = reserved + qty, available = available - qty WHERE variant_id = ?
        OrderService->>DB: INSERT INTO orders (order_number, total_amount, status='PENDING', ...)
        OrderService->>DB: INSERT INTO order_items (order_id, product_id, variant_id, unit_price, quantity)
        OrderService->>DB: DELETE FROM cart_items WHERE cart_id = userCart.id
    end

    OrderService-->>CheckoutController: Return OrderDto
    CheckoutController-->>OrderAPI: 201 Created (ApiResponse<OrderDto>)
    OrderAPI-->>CheckoutUI: Order confirmed (Order ID: ord-xxx)

    opt If Online Payment (Razorpay)
        CheckoutUI->>PaymentService: paymentApi.createPayment({orderId, provider: 'RAZORPAY'})
        PaymentService->>DB: INSERT INTO payments (status='PENDING')
        PaymentService-->>CheckoutUI: Razorpay Order Payload
        User->>CheckoutUI: Completes Razorpay Gateway SDK popup
        CheckoutUI->>PaymentService: POST /api/v1/payments/webhook (Signature + Payload)
        PaymentService->>DB: UPDATE payments SET status='COMPLETED', paid_at=NOW()
        PaymentService->>OrderService: updateOrderStatus(orderId, 'CONFIRMED')
        OrderService->>InventoryService: commitReservation(orderItems)
        InventoryService->>DB: UPDATE inventory SET quantity = quantity - reserved, reserved = 0
    end

    CheckoutUI->>OrderUI: Navigate to /orders/[id]
    OrderUI->>OrderAPI: orderApi.getOrderById(orderId)
    OrderAPI-->>OrderUI: Order details with tracking status, invoice download, and items
    OrderUI-->>User: Display "Order Confirmed" receipt with visual status timeline
```
