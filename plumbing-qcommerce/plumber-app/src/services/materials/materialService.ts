import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { canUseDevMockFallbacks, createBackendUnavailableError, warnUsingDevMockFallback } from '../mockPolicy';
import { MaterialItem, MaterialRequest, Store } from '../../types';

export interface MaterialRequestSummary {
  id: number;
  serviceOrderId: number;
  storeName: string | null;
  status: string;
  totalAmount: number | null;
}

const parseServiceOrderId = (serviceOrderId: string): number => {
  const digits = String(serviceOrderId || '').match(/\d+/)?.[0];
  const orderId = digits ? Number(digits) : NaN;
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error(`Invalid service order id: ${serviceOrderId}`);
  }
  return orderId;
};

const MOCK_STORES: Store[] = [
  { id: 1, name: 'FixKart Quick Hub - Indiranagar', address: '100ft Rd, HAL 2nd Stage, Indiranagar', latitude: 12.9716, longitude: 77.6412 },
  { id: 2, name: 'FixKart Partner Store - Koramangala', address: '80ft Rd, 4th Block, Koramangala', latitude: 12.9352, longitude: 77.6245 },
  { id: 3, name: 'Metro Plumbing Supplies - HSR', address: '27th Main Rd, Sector 1, HSR Layout', latitude: 12.9121, longitude: 77.6446 },
];

const MOCK_STORE_INVENTORY: MaterialItem[] = [
  { productId: 101, name: 'PVC Elbow 1/2 inch 90-Deg', price: 45, quantity: 0, availableQuantity: 35 },
  { productId: 102, name: 'PVC Pipe 1/2 inch (3 meters)', price: 120, quantity: 0, availableQuantity: 20 },
  { productId: 103, name: 'Thread Seal Teflon Tape (12m)', price: 25, quantity: 0, availableQuantity: 50 },
  { productId: 104, name: 'PVC Solvent Cement 100ml', price: 85, quantity: 0, availableQuantity: 18 },
  { productId: 105, name: 'Brass Ball Valve 1/2 inch', price: 260, quantity: 0, availableQuantity: 12 },
  { productId: 106, name: 'Flexible Waste Pipe (Sink)', price: 95, quantity: 0, availableQuantity: 24 },
  { productId: 107, name: 'Angle Valve Chrome Plated', price: 340, quantity: 0, availableQuantity: 15 },
  { productId: 108, name: 'Rubber Gasket O-Ring Pack', price: 40, quantity: 0, availableQuantity: 40 },
];

const MOCK_TRACKING_DETAIL = {
  id: 101,
  status: 'READY_FOR_PICKUP',
  storeName: 'FixKart Quick Hub - Indiranagar',
  storeAddress: '100ft Rd, HAL 2nd Stage, Indiranagar',
  totalAmount: 375,
  storeConfirmedAt: new Date().toISOString(),
  plumberArrivedAt: null,
  plumberCollectedAt: null,
  collectionConfirmedAt: null,
  notes: 'Counter #3 - Ready for Plumber pickup',
  items: [
    { productName: 'PVC Elbow 1/2 inch', requestedQuantity: 2, reservedQuantity: 2 },
    { productName: 'PVC Pipe 1/2 inch (3ft)', requestedQuantity: 1, reservedQuantity: 1 },
    { productName: 'Thread Seal Tape', requestedQuantity: 1, reservedQuantity: 1 },
  ],
};

export const materialService = {
  listMyRequests: async (): Promise<MaterialRequestSummary[]> => {
    try {
      const response = await apiClient.get<MaterialRequestSummary[]>('/plumber/material-requests');
      return response.data;
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        return [{ id: 101, serviceOrderId: 1024, storeName: 'FixKart Quick Hub', status: 'READY_FOR_PICKUP', totalAmount: 375 }];
      }
      throw createBackendUnavailableError('Material requests', error);
    }
  },

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
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store list', error);
        return MOCK_STORES;
      }
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
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store inventory', error);
        return MOCK_STORE_INVENTORY;
      }
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
      if (canUseDevMockFallbacks()) {
        return MOCK_STORE_INVENTORY.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
      }
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
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Create material request', error);
        return {
          id: 101,
          totalAmount: 375,
          items: items.map(i => ({ productId: i.productId, name: `Part #${i.productId}`, price: 125, quantity: i.quantity })),
        };
      }
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
      if (canUseDevMockFallbacks()) return;
      throw createBackendUnavailableError('Material request update', error);
    }
  },

  cancelMaterialRequest: async (requestId: number, reason?: string): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.DELIVERY.CANCEL(requestId), { reason });
    } catch (error) {
      if (canUseDevMockFallbacks()) return;
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
      if (canUseDevMockFallbacks()) return 'APPROVED';
      throw createBackendUnavailableError('Material request status', error);
    }
  },

  fetchMaterialDetails: async (orderId: number): Promise<any> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.DELIVERY.STATUS(orderId));
      return response.data;
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Material details', error);
        return MOCK_TRACKING_DETAIL;
      }
      throw createBackendUnavailableError('Material request details', error);
    }
  },

  fetchMaterialHistory: async (requestId: number): Promise<any[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.DELIVERY.HISTORY(requestId));
      return response.data || [];
    } catch (error) {
      if (canUseDevMockFallbacks()) return [];
      throw createBackendUnavailableError('Material request history', error);
    }
  },

  // ── Pickup Actions ────────────────────────────────────────────────────────

  markArrivedAtStore: async (requestId: number): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.DELIVERY.ARRIVED(requestId));
    } catch (error) {
      if (canUseDevMockFallbacks()) return;
      throw createBackendUnavailableError('Mark arrived at store', error);
    }
  },

  confirmCollection: async (requestId: number): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.DELIVERY.COLLECT(requestId));
    } catch (error) {
      if (canUseDevMockFallbacks()) return;
      throw createBackendUnavailableError('Confirm material collection', error);
    }
  },
};
