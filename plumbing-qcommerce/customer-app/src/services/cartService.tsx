import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PlumbingService } from '../data/services';
import { Product } from '../data/products';
import { tokenStorage } from './api/tokenStorage';
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  boundCartQuantity,
  parsePersistedCart,
} from './cartPersistence';

export interface CartItem {
  id: string;
  itemType: 'service' | 'product';
  title: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
  availableQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: PlumbingService | Product, itemType: 'service' | 'product') => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  visitingFee: number;
  tax: number;
  discount: number;
  total: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const changedBeforeHydration = useRef(false);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const raw = await tokenStorage.getItem(CART_STORAGE_KEY);
        const persistedItems = parsePersistedCart(raw);
        if (mounted && !changedBeforeHydration.current) setItems(persistedItems);
      } catch {
        if (mounted && !changedBeforeHydration.current) setItems([]);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    tokenStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      version: CART_STORAGE_VERSION,
      items,
    })).catch(() => undefined);
  }, [items, isHydrated]);

  const addItem = (item: PlumbingService | Product, itemType: 'service' | 'product') => {
    changedBeforeHydration.current = true;
    const availableQuantity = 'availableQuantity' in item ? item.availableQuantity : undefined;
    if (itemType === 'product' && availableQuantity !== undefined && availableQuantity <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const maximum = availableQuantity ?? existing.availableQuantity;
        const nextQuantity = existing.quantity + 1;
        if (maximum !== undefined && nextQuantity > maximum) return prev;
        return prev.map((i) => (i.id === item.id
          ? { ...i, availableQuantity: maximum, quantity: nextQuantity }
          : i));
      }
      return [
        ...prev,
        {
          id: item.id,
          itemType,
          title: 'title' in item ? item.title : item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: 1,
          imageUrl: item.imageUrl,
          unit: 'unit' in item ? item.unit : undefined,
          availableQuantity,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    changedBeforeHydration.current = true;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    changedBeforeHydration.current = true;
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const boundedQty = boundCartQuantity(i.quantity, delta, i.availableQuantity);
            return boundedQty > 0 ? { ...i, quantity: boundedQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    changedBeforeHydration.current = true;
    setItems([]);
    setAppliedCoupon(null);
    setDiscount(0);
  };

  const applyCoupon = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'FIXFIRST50' || normalized === 'FIX50') {
      setAppliedCoupon(normalized);
      setDiscount(50);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Product checkout is a catalog purchase and has no service-visit charge.
  // Keep the service pricing model isolated to service carts; mixed carts are
  // rejected at checkout rather than silently combining the two domains.
  const hasService = items.some((i) => i.itemType === 'service');
  const visitingFee = items.length === 0 || !hasService ? 0 : 49;
  const tax = hasService ? Math.round(subtotal * 0.05) : 0;
  const total = items.length === 0 ? 0 : Math.max(0, subtotal + visitingFee + tax - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        visitingFee,
        tax,
        discount,
        total,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {isHydrated ? children : null}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
