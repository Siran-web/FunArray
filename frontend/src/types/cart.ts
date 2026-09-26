export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku: string;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}
