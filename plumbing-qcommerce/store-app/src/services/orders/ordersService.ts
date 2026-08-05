import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Order } from '../../types';
import { mockOrders } from '../../mocks';
import { storeService } from '../store/storeService';
import { dispatchService } from '../dispatch/dispatchService';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  createUnsupportedBackendError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

let localOrders: Order[] = [...mockOrders];
const ORDER_STATUSES = ['CONFIRMED', 'PACKING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const mapApiOrderToOrder = (order: any): Order => ({
  id: order.id,
  customerId: order.customerId || order.customer?.id || 0,
  customerName: order.customerName || order.customer?.fullName || 'Customer',
  customerPhone: order.customerPhone || order.customer?.phone,
  storeId: order.storeId || order.store?.id || 0,
  storeName: order.storeName || order.store?.name || 'Store',
  totalAmount: Number(order.totalAmount || 0),
  status: order.status,
  createdAt: order.createdAt || new Date().toISOString(),
  deliveryPartnerName: order.deliveryPartnerName,
  deliveryPartnerPhone: order.deliveryPartnerPhone,
  deliveryOtp: order.deliveryOtp,
  estimatedDeliveryAt: order.estimatedDeliveryAt,
  address: order.address || order.description || 'Staging backend service location',
  items: (order.items || []).map((item: any) => ({
    productId: item.productId,
    productName: item.productName || 'Item',
    quantity: item.quantity,
    price: Number(item.price || 0),
  })),
});

const loadOrdersByStatus = async (statuses: string[]): Promise<Order[]> => {
  const responses = await Promise.all(statuses.map((status) => apiClient.get(ENDPOINTS.orders.byStatus(status))));
  const merged = responses.flatMap((response) => response.data || []).map(mapApiOrderToOrder);
  const deduped = new Map<number, Order>();
  merged.forEach((order) => deduped.set(order.id, order));
  return Array.from(deduped.values()).sort((left, right) => right.id - left.id);
};

export const ordersService = {
  getOrders: async (): Promise<Order[]> => {
    try {
      const orders = await loadOrdersByStatus(ORDER_STATUSES);
      localOrders = orders;
      return orders;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store order list', e);
        return localOrders;
      }
      throw createBackendUnavailableError('store orders', e);
    }
  },

  getOrderDetails: async (orderId: number): Promise<Order> => {
    try {
      const response = await apiClient.get(ENDPOINTS.orders.details(orderId));
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store order details ${orderId}`, e);
        const found = localOrders.find((order) => order.id === orderId);
        if (!found) throw new Error('Order not found');
        return found;
      }
      throw createBackendUnavailableError(`order details for ${orderId}`, e);
    }
  },

  acceptOrder: async (orderId: number, storeId?: number): Promise<Order> => {
    try {
      const storeProfile = storeId ? { id: storeId } : await storeService.getCurrentStoreProfile();
      const response = await apiClient.patch(ENDPOINTS.orders.accept(orderId), { storeId: storeProfile.id });
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store accept order ${orderId}`, e);
        const idx = localOrders.findIndex((order) => order.id === orderId);
        if (idx !== -1) {
          localOrders[idx] = { ...localOrders[idx], status: 'PACKING' };
          return localOrders[idx];
        }
        throw new Error('Order not found');
      }
      throw createBackendUnavailableError(`accept order ${orderId}`, e);
    }
  },

  rejectOrder: async (orderId: number): Promise<Order> => {
    if (!canUseDevMockFallbacks()) {
      throw createUnsupportedBackendError('Store order rejection');
    }

    warnUsingDevMockFallback(`Store reject order ${orderId}`, new Error('Store order rejection'));
    const idx = localOrders.findIndex((order) => order.id === orderId);
    if (idx !== -1) {
      localOrders[idx] = { ...localOrders[idx], status: 'CANCELLED' };
      return localOrders[idx];
    }
    throw new Error('Order not found');
  },

  markPacking: async (orderId: number, storeId?: number): Promise<Order> => {
    return ordersService.acceptOrder(orderId, storeId);
  },

  markPacked: async (orderId: number, packingNote?: string, storeId?: number): Promise<Order> => {
    try {
      const storeProfile = storeId ? { id: storeId } : await storeService.getCurrentStoreProfile();
      const response = await apiClient.patch(ENDPOINTS.orders.pack(orderId), { storeId: storeProfile.id, packingNote });
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store mark packed ${orderId}`, e);
        const idx = localOrders.findIndex((order) => order.id === orderId);
        if (idx !== -1) {
          localOrders[idx] = { ...localOrders[idx], status: 'READY_FOR_PICKUP', packingNote };
          return localOrders[idx];
        }
        throw new Error('Order not found');
      }
      throw createBackendUnavailableError(`mark packed for order ${orderId}`, e);
    }
  },

  handOverPackage: async (orderId: number, deliveryPartnerId?: number, otp?: string, storeId?: number): Promise<Order> => {
    try {
      try {
        const response = await apiClient.post(ENDPOINTS.materialRequests.confirmCollection(orderId));
        return mapApiOrderToOrder(response.data);
      } catch (confirmError: any) {
        if (confirmError?.response?.status !== 404 && confirmError?.response?.status !== 400) {
          throw confirmError;
        }
        const storeProfile = storeId ? { id: storeId } : await storeService.getCurrentStoreProfile();
        const response = await apiClient.post(ENDPOINTS.orders.handover(orderId), {
          storeId: storeProfile.id,
          deliveryPartnerId: deliveryPartnerId || 10,
          otp: otp || '1234',
        });
        return mapApiOrderToOrder(response.data);
      }
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store handover package ${orderId}`, e);
        const idx = localOrders.findIndex((order) => order.id === orderId);
        if (idx !== -1) {
          localOrders[idx] = { ...localOrders[idx], status: 'COLLECTED' };
          return localOrders[idx];
        }
        throw new Error('Order not found');
      }
      throw createBackendUnavailableError(`handover package for order ${orderId}`, e);
    }
  },

  // Fetch a single order by ID (for ReadyForPickupScreen).
  getOrderById: async (orderId: number): Promise<Order> => {
    try {
      const response = await apiClient.get(ENDPOINTS.orders.details(orderId));
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      throw createBackendUnavailableError(`order details for ${orderId}`, e);
    }
  },

  // Confirm that the plumber has physically collected the packed materials.
  confirmPickup: async (orderId: number): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.materialRequests.confirmCollection(orderId));
    } catch (confirmErr: any) {
      // Also try the order handover endpoint as fallback for checkout orders.
      if (confirmErr?.response?.status === 404 || confirmErr?.response?.status === 400) {
        try {
          const storeProfile = await storeService.getCurrentStoreProfile();
          await apiClient.post(ENDPOINTS.orders.handover(orderId), {
            storeId: storeProfile.id,
          });
          return;
        } catch {}
      }
      throw createBackendUnavailableError(`confirm pickup for order ${orderId}`, confirmErr);
    }
  },
};

