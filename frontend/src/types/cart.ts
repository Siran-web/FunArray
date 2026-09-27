export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku?: string;
  selectedColor?: string;
  material?: string;
  dimensions?: {
    widthCm: number;
    heightCm: number;
    depthCm: number;
  };
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}
