import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from './api/apiClient';
import { useAuth } from './authService';
import {
  ServiceOrder,
  OrderStatus as BackendOrderStatus,
  MaterialRequestSummaryResponse,
  RatingResponse,
  ServiceOrderStatusHistoryResponse,
} from '../types/backend';
import { Order, OrderStatus as UIOrderStatus, OrderItem } from '../data/orders';
import { CartItem } from './cartService';
import { mapBackendStatusToUI, mapBackendOrderToUI } from './orderMappers';

export { mapBackendStatusToUI, mapBackendOrderToUI };

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | undefined;
  isLoading: boolean;
  getOrderById: (id: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
  fetchOrderDetails: (id: string) => Promise<ServiceOrder | null>;
  createOrderFromCart: (
    items: CartItem[],
    subtotal: number,
    discount: number,
    tax: number,
    visitingFee: number,
    total: number,
    address: string,
    paymentMethod: string,
    coordinates?: { latitude: number; longitude: number }
  ) => Promise<Order>;
  confirmServiceCompletion: (orderId: string) => Promise<boolean>;
  submitOrderRating: (orderId: string, rating: number, comment?: string) => Promise<boolean>;
  cancelServiceOrder: (orderId: string) => Promise<boolean>;
  fetchMaterialRequests: (orderId: string) => Promise<MaterialRequestSummaryResponse[]>;
  approveMaterial: (orderId: string, materialId: string) => void;
  updateOrderStatus: (orderId: string, newStatus: UIOrderStatus) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { rawUser, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshOrders = useCallback(async () => {
    if (!isAuthenticated || !rawUser?.id) return;
    setIsLoading(true);
    try {
      const backendOrders = await apiClient.get<ServiceOrder[]>(
        `/orders/customer/${rawUser.id}`,
        { timeoutMs: 12000 }
      );
      if (Array.isArray(backendOrders)) {
        const mapped = backendOrders
          .sort((a, b) => b.id - a.id)
          .map(mapBackendOrderToUI);
        setOrders(mapped);
      }
    } catch (err) {
      console.warn('Failed to load customer orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, rawUser?.id]);

  useEffect(() => {
    if (isAuthenticated && rawUser?.id) {
      refreshOrders();
    } else {
      setOrders([]);
    }
  }, [isAuthenticated, rawUser?.id, refreshOrders]);

  const getOrderById = (id: string) => {
    return orders.find((o) => o.id === id);
  };

  const activeOrder = orders.find(
    (o) =>
      o.status === 'in_progress' ||
      o.status === 'assigned' ||
      o.status === 'requested' ||
      o.status === 'confirmed' ||
      o.status === 'materials_pending'
  );

  const fetchOrderDetails = async (id: string): Promise<ServiceOrder | null> => {
    const numericId = Number(id.replace(/[^0-9]/g, ''));
    if (!numericId) return null;
    try {
      const details = await apiClient.get<ServiceOrder>(`/orders/${numericId}`);
      if (details) {
        const mapped = mapBackendOrderToUI(details);
        setOrders((prev) => {
          const index = prev.findIndex((o) => o.id === String(details.id));
          if (index >= 0) {
            const next = [...prev];
            next[index] = mapped;
            return next;
          }
          return [mapped, ...prev];
        });
        return details;
      }
    } catch (e) {
      console.warn(`Failed to fetch details for order ${numericId}:`, e);
    }
    return null;
  };

  const createOrderFromCart = async (
    items: CartItem[],
    subtotal: number,
    discount: number,
    tax: number,
    visitingFee: number,
    total: number,
    address: string,
    paymentMethod: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<Order> => {
    const itemNames = items.map((i) => `${i.title} (x${i.quantity})`).join(', ');
    const description = `${itemNames} | Address: ${address}`;

    const payload = {
      description,
      latitude: coordinates?.latitude || 12.9141,
      longitude: coordinates?.longitude || 77.6411,
      requestType: 'NEARBY_AUTO',
    };

    const backendOrder = await apiClient.post<ServiceOrder>('/orders', payload);
    const mappedOrder = mapBackendOrderToUI(backendOrder);
    mappedOrder.address = address;
    mappedOrder.paymentMethod = paymentMethod;

    setOrders((prev) => [mappedOrder, ...prev.filter((o) => o.id !== mappedOrder.id)]);
    return mappedOrder;
  };

  const confirmServiceCompletion = async (orderId: string): Promise<boolean> => {
    const numericId = Number(orderId.replace(/[^0-9]/g, ''));
    if (!numericId) return false;
    try {
      await apiClient.post(`/orders/${numericId}/confirm`);
      await fetchOrderDetails(String(numericId));
      return true;
    } catch (e) {
      console.error('Failed to confirm order completion:', e);
      return false;
    }
  };

  const submitOrderRating = async (orderId: string, rating: number, comment?: string): Promise<boolean> => {
    const numericId = Number(orderId.replace(/[^0-9]/g, ''));
    if (!numericId) return false;
    try {
      await apiClient.post<RatingResponse>(`/orders/${numericId}/rating`, {
        rating,
        comment: comment || '',
      });
      await fetchOrderDetails(String(numericId));
      return true;
    } catch (e) {
      console.error('Failed to submit rating:', e);
      return false;
    }
  };

  const cancelServiceOrder = async (orderId: string): Promise<boolean> => {
    const numericId = Number(orderId.replace(/[^0-9]/g, ''));
    if (!numericId) return false;
    try {
      await apiClient.patch(`/orders/${numericId}/cancel`);
      await fetchOrderDetails(String(numericId));
      return true;
    } catch (e) {
      console.error('Failed to cancel order:', e);
      return false;
    }
  };

  const fetchMaterialRequests = async (orderId: string): Promise<MaterialRequestSummaryResponse[]> => {
    const numericId = Number(orderId.replace(/[^0-9]/g, ''));
    if (!numericId) return [];
    try {
      const list = await apiClient.get<MaterialRequestSummaryResponse[]>(
        `/service-orders/${numericId}/material-requests`
      );
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  const approveMaterial = (orderId: string, materialId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.materialsApproved) {
          const updatedMats = o.materialsApproved.map((m) =>
            m.id === materialId ? { ...m, approved: true } : m
          );
          return { ...o, materialsApproved: updatedMats };
        }
        return o;
      })
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: UIOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return { ...o, status: newStatus };
        }
        return o;
      })
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        isLoading,
        getOrderById,
        refreshOrders,
        fetchOrderDetails,
        createOrderFromCart,
        confirmServiceCompletion,
        submitOrderRating,
        cancelServiceOrder,
        fetchMaterialRequests,
        approveMaterial,
        updateOrderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
