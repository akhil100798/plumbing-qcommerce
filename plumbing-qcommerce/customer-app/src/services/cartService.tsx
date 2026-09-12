import React, { createContext, useContext, useState } from 'react';
import { PlumbingService } from '../data/services';
import { Product } from '../data/products';

export interface CartItem {
  id: string;
  itemType: 'service' | 'product';
  title: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
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
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  const addItem = (item: PlumbingService | Product, itemType: 'service' | 'product') => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
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
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
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
  const visitingFee = items.length === 0 ? 0 : items.some((i) => i.itemType === 'service') ? 49 : 29;
  const tax = Math.round(subtotal * 0.05);
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
      {children}
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
