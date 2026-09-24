import { apiClient } from './api/apiClient';
import { CartItem } from './cartService';
import { ProductOrderStatus, StoreSummary } from '../types/backend';

export interface ProductOrderItemDetail {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface ProductOrderDetail {
  id: number;
  customerId: number;
  storeId: number;
  storeName: string;
  totalAmount: number;
  status: ProductOrderStatus;
  createdAt?: string;
  items: ProductOrderItemDetail[];
  serviceOrderId?: number;
}

export interface ProductCheckoutRequest {
  storeId: number;
  items: Array<{ productId: number; quantity: number }>;
}

export function buildProductCheckoutRequest(items: CartItem[], storeId: number): ProductCheckoutRequest {
  if (!Number.isInteger(storeId) || storeId <= 0) {
    throw new Error('Select a valid store before checkout.');
  }

  if (items.length === 0 || items.some((item) => item.itemType !== 'product')) {
    throw new Error('Product checkout requires a product-only cart.');
  }

  const requestItems = items.map((item) => {
    const match = /^prod_(\d+)$/.exec(item.id);
    const productId = match ? Number(match[1]) : Number(item.id);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Cart contains an invalid product or quantity.');
    }
    return { productId, quantity: item.quantity };
  });

  return { storeId, items: requestItems };
}

export function productCheckoutSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function reserveAndConfirmProductCheckout(
  items: CartItem[],
  storeId: number,
): Promise<ProductOrderDetail> {
  const request = buildProductCheckoutRequest(items, storeId);
  const reserved = await apiClient.post<{ id: number }>('/checkout/reserve', request);
  let confirmed = false;

  try {
    await apiClient.post(`/checkout/confirm/${reserved.id}`);
    confirmed = true;
    return await apiClient.get<ProductOrderDetail>(`/checkout/orders/${reserved.id}`);
  } catch (error) {
    if (!confirmed) {
      try {
        await apiClient.post(`/checkout/release/${reserved.id}`);
      } catch {
        // Preserve the original checkout error. The backend transaction remains
        // authoritative and the failed release is visible to runtime evidence.
      }
    }
    throw error;
  }
}

export function isStoreCompatibleWithCart(
  store: StoreSummary,
  inventory: Array<{ product?: { id?: number }; availableQuantity?: number }>,
  items: CartItem[],
): boolean {
  return items.every((item) => {
    const productId = Number(item.id.replace(/^prod_/, ''));
    const stock = inventory.find((entry) => entry.product?.id === productId);
    return !!stock && (stock.availableQuantity ?? 0) >= item.quantity;
  });
}
