export interface CartItemDTO {
  productId: number;
  quantity: number;
}

export interface CheckoutRequest {
  storeId: number;
  items: CartItemDTO[];
}

export interface ProductOrderDTO {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}
