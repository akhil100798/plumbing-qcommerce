import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Order } from '../../types';
import { mockOrders } from '../../mocks';
import { store } from '../../redux/store';
import { dispatchService } from '../dispatch/dispatchService';

// In-memory state helper for mocks
let localOrders: Order[] = [...mockOrders];

const mapApiOrderToOrder = (o: any): Order => {
  return {
    id: o.id,
    customerId: o.customerId || 0,
    customerName: o.customerName || 'Customer',
    storeId: o.storeId || 0,
    storeName: o.storeName || 'Store',
    totalAmount: o.totalAmount,
    status: o.status as any,
    createdAt: o.createdAt || new Date().toISOString(),
    deliveryPartnerName: o.deliveryPartnerName,
    deliveryPartnerPhone: o.deliveryPartnerPhone,
    deliveryOtp: o.deliveryOtp,
    estimatedDeliveryAt: o.estimatedDeliveryAt,
    items: (o.items || []).map((i: any) => ({
      productId: i.productId,
      productName: i.productName || 'Item',
      quantity: i.quantity,
      price: i.price,
    }))
  };
};

export const ordersService = {
  getOrders: async (): Promise<Order[]> => {
    try {
      // Store managers fetch orders. Since the API gets by status, we gather PENDING orders
      const response = await apiClient.get(ENDPOINTS.orders.byStatus('PENDING'));
      // Combine with local orders to make sure packing/ready statuses are available
      const apiOrders: Order[] = (response.data || []).map((o: any) => ({
        id: o.id,
        customerId: o.customer?.id || 0,
        customerName: o.customer?.fullName || 'Customer',
        storeId: o.store?.id || 0,
        storeName: o.store?.name || 'Store',
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
        items: (o.items || []).map((i: any) => ({
          productId: i.product?.id || 0,
          productName: i.product?.name || 'Item',
          quantity: i.quantity,
          price: i.price,
        }))
      }));

      // Merge API and local orders
      const orderIds = new Set(apiOrders.map(o => o.id));
      const combined = [
        ...apiOrders,
        ...localOrders.filter(o => !orderIds.has(o.id))
      ];
      return combined;
    } catch (e) {
      console.warn('API getOrders failed, using local mock data:', e);
      return localOrders;
    }
  },

  getOrderDetails: async (orderId: number): Promise<Order> => {
    try {
      const response = await apiClient.get(ENDPOINTS.orders.details(orderId));
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      console.warn(`API getOrderDetails ${orderId} failed, using local mock:`, e);
      const found = localOrders.find(o => o.id === orderId);
      if (!found) throw new Error('Order not found');
      return found;
    }
  },

  acceptOrder: async (orderId: number, storeId?: number): Promise<Order> => {
    try {
      const sId = storeId || store.getState().profile.storeProfile?.id || 123;
      const response = await apiClient.patch(ENDPOINTS.orders.accept(orderId), { storeId: sId });
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      console.warn(`API acceptOrder ${orderId} failed, Fallback to mock:`, e);
      const idx = localOrders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        localOrders[idx] = { ...localOrders[idx], status: 'CONFIRMED' };
        return localOrders[idx];
      }
      throw new Error('Order not found');
    }
  },

  rejectOrder: async (orderId: number): Promise<Order> => {
    console.warn(`rejectOrder ${orderId} API missing. Fallback to mock.`);
    const idx = localOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      localOrders[idx] = { ...localOrders[idx], status: 'CANCELLED' };
      return localOrders[idx];
    }
    throw new Error('Order not found');
  },

  markPacking: async (orderId: number, storeId?: number): Promise<Order> => {
    try {
      const sId = storeId || store.getState().profile.storeProfile?.id || 123;
      const response = await apiClient.patch(ENDPOINTS.orders.accept(orderId), { storeId: sId });
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      console.warn(`API markPacking ${orderId} failed, Fallback to mock:`, e);
      const idx = localOrders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        localOrders[idx] = { ...localOrders[idx], status: 'PACKING' };
        return localOrders[idx];
      }
      throw new Error('Order not found');
    }
  },

  markPacked: async (orderId: number, packingNote?: string, storeId?: number): Promise<Order> => {
    try {
      const sId = storeId || store.getState().profile.storeProfile?.id || 123;
      const response = await apiClient.patch(ENDPOINTS.orders.pack(orderId), { storeId: sId, packingNote });
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      console.warn(`API markPacked ${orderId} failed, Fallback to mock:`, e);
      const idx = localOrders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        localOrders[idx] = { ...localOrders[idx], status: 'READY_FOR_PICKUP', packingNote };
        return localOrders[idx];
      }
      throw new Error('Order not found');
    }
  },

  handOverPackage: async (orderId: number, deliveryPartnerId?: number, otp?: string, storeId?: number): Promise<Order> => {
    try {
      const sId = storeId || store.getState().profile.storeProfile?.id || 123;
      let dpId = deliveryPartnerId;
      let deliveryOtp = otp;
      
      if (!dpId || !deliveryOtp) {
        const details = await ordersService.getOrderDetails(orderId);
        deliveryOtp = deliveryOtp || details.deliveryOtp || '1234';
        
        if (!dpId && details.deliveryPartnerName) {
          try {
            const riders = await dispatchService.getAvailableRiders();
            const found = riders.find(r => r.fullName === details.deliveryPartnerName);
            if (found) dpId = found.id;
          } catch (err) {
            console.warn('Failed to resolve rider name to ID:', err);
          }
        }
        
        if (!dpId) {
          try {
            const riders = await dispatchService.getAvailableRiders();
            if (riders.length > 0) {
              dpId = riders[0].id;
            } else {
              dpId = 1;
            }
          } catch (err) {
            dpId = 1;
          }
        }
      }

      const response = await apiClient.post(ENDPOINTS.orders.handover(orderId), {
        storeId: sId,
        deliveryPartnerId: dpId,
        otp: deliveryOtp
      });
      return mapApiOrderToOrder(response.data);
    } catch (e) {
      console.warn(`API handOverPackage ${orderId} failed, Fallback to mock:`, e);
      const idx = localOrders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        localOrders[idx] = { ...localOrders[idx], status: 'OUT_FOR_DELIVERY' };
        return localOrders[idx];
      }
      throw new Error('Order not found');
    }
  }
};
