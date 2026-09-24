import type { CartItem } from './cartService';

export const CART_STORAGE_KEY = 'fixkart.customer.cart.v1';
export const CART_STORAGE_VERSION = 1;

export function isValidPersistedItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  const quantity = item.quantity;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) return false;
  return typeof item.id === 'string' &&
    (item.itemType === 'service' || item.itemType === 'product') &&
    typeof item.title === 'string' &&
    typeof item.price === 'number' && Number.isFinite(item.price) &&
    typeof item.originalPrice === 'number' && Number.isFinite(item.originalPrice) &&
    (item.availableQuantity === undefined ||
      (Number.isInteger(item.availableQuantity) && item.availableQuantity > 0 && quantity <= item.availableQuantity));
}

export function parsePersistedCart(raw: string | null): CartItem[] {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.version === CART_STORAGE_VERSION && Array.isArray(parsed.items)
      ? parsed.items.filter(isValidPersistedItem)
      : [];
  } catch {
    return [];
  }
}

export function boundCartQuantity(quantity: number, delta: number, availableQuantity?: number): number {
  const next = quantity + delta;
  const bounded = availableQuantity === undefined ? next : Math.min(next, availableQuantity);
  return bounded > 0 ? bounded : 0;
}
