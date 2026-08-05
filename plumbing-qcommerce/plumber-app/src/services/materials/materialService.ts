import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { createBackendUnavailableError } from '../mockPolicy';
import { MaterialItem, MaterialRequest, Store } from '../../types';

const parseServiceOrderId = (serviceOrderId: string): number => {
  const digits = String(serviceOrderId || '').match(/\d+/)?.[0];
  const orderId = digits ? Number(digits) : NaN;
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error(`Invalid service order id: ${serviceOrderId}`);
  }
  return orderId;
};

export const materialService = {
  // ── Store Discovery ──────────────────────────────────────────────────────

  getAvailableStores: async (): Promise<Store[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.STORES.LIST);
      return (response.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
      }));
    } catch (error) {
      throw createBackendUnavailableError('Store list', error);
    }
  },

  getStoreInventory: async (storeId: number): Promise<MaterialItem[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.STORES.INVENTORY(storeId));
      return (response.data || [])
        .filter((stock: any) => stock.availableQuantity > 0)
        .map((stock: any) => ({
          productId: stock.product?.id ?? stock.productId,
          name: stock.product?.name ?? stock.productName ?? 'Unknown product',
          price: stock.product?.price ?? stock.price ?? 0,
          quantity: 0,
          image: stock.product?.imageUrl,
          availableQuantity: stock.availableQuantity,
        }));
    } catch (error) {
      throw createBackendUnavailableError('Store inventory', error);
    }
  },

  // ── Catalog Search ───────────────────────────────────────────────────────

  searchMaterials: async (query: string): Promise<MaterialItem[]> => {
    try {
      const response = await apiClient.get<any[]>(`${ENDPOINTS.CATALOG.SEARCH}?q=${query}`);
      return response.data.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: 0,
        image: item.imageUrl,
      }));
    } catch (error) {
      throw createBackendUnavailableError('Material catalog search', error);
    }
  },

  // ── Create / Update Request ──────────────────────────────────────────────

  createMaterialRequest: async (
    serviceOrderId: string,
    storeId: number,
    items: { productId: number; quantity: number }[]
  ): Promise<{ id: number; totalAmount: number; items: MaterialItem[] }> => {
    try {
      const numericOrderId = parseServiceOrderId(serviceOrderId);
      const response = await apiClient.post<any>(
        ENDPOINTS.DELIVERY.MATERIAL_REQUEST(numericOrderId),
        { storeId, items }
      );
      await apiClient.post(ENDPOINTS.DELIVERY.SUBMIT(response.data.id));

      const order = response.data;
      const mappedItems: MaterialItem[] = (order.items || items).map((reqItem: any) => {
        const matchingRequest =
          'productId' in reqItem
            ? items.find((item) => item.productId === reqItem.productId)
            : undefined;
        return {
          productId: reqItem.productId,
          name: reqItem.productName || reqItem.name || `Product #${reqItem.productId}`,
          price: reqItem.price || reqItem.unitPrice || 0,
          quantity: reqItem.requestedQuantity || reqItem.quantity || matchingRequest?.quantity || 0,
        };
      });

      const totalAmount =
        order.totalAmount ||
        mappedItems.reduce((acc: number, item: MaterialItem) => acc + item.price * item.quantity, 0);

      return { id: order.id, totalAmount, items: mappedItems };
    } catch (error) {
      throw createBackendUnavailableError('Material request creation', error);
    }
  },

  updateMaterialRequest: async (
    requestId: number,
    storeId: number,
    items: { productId: number; quantity: number }[]
  ): Promise<void> => {
    try {
      await apiClient.put(ENDPOINTS.DELIVERY.MATERIAL_REQUEST(requestId), { storeId, items });
    } catch (error) {
      throw createBackendUnavailableError('Material request update', error);
    }
  },

  cancelMaterialRequest: async (requestId: number, reason?: string): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.DELIVERY.CANCEL(requestId), { reason });
    } catch (error) {
      throw createBackendUnavailableError('Material request cancellation', error);
    }
  },

  // ── Status / Details ─────────────────────────────────────────────────────

  fetchMaterialStatus: async (orderId: number): Promise<MaterialRequest['status']> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.DELIVERY.STATUS(orderId));
      const order = response.data;
      if (order.status === 'COLLECTED') return 'DELIVERED';
      if (order.status === 'READY_FOR_PICKUP' || order.status === 'PLUMBER_AT_STORE') return 'DELIVERING';
      if (order.status === 'CANCELLED' || order.status === 'REJECTED') return 'REJECTED';
      if (order.status === 'REQUESTED' || order.status === 'STORE_REVIEWING') return 'PENDING_APPROVAL';
      return 'APPROVED';
    } catch (error) {
      throw createBackendUnavailableError('Material request status', error);
    }
  },

  fetchMaterialDetails: async (orderId: number): Promise<any> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.DELIVERY.STATUS(orderId));
      return response.data;
    } catch (error) {
      throw createBackendUnavailableError('Material request details', error);
    }
  },

  fetchMaterialHistory: async (requestId: number): Promise<any[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.DELIVERY.HISTORY(requestId));
      return response.data || [];
    } catch (error) {
      throw createBackendUnavailableError('Material request history', error);
    }
  },

  // ── Pickup Actions ────────────────────────────────────────────────────────

  markArrivedAtStore: async (requestId: number): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.DELIVERY.ARRIVED(requestId));
    } catch (error) {
      throw createBackendUnavailableError('Mark arrived at store', error);
    }
  },

  confirmCollection: async (requestId: number): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.DELIVERY.COLLECT(requestId));
    } catch (error) {
      throw createBackendUnavailableError('Confirm material collection', error);
    }
  },
};
