export interface PhysicalStore {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface StoreInventoryStatus {
  storeId: string;
  storeName: string;
  city: string;
  availableQuantity: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}
