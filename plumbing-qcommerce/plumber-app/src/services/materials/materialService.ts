import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { createBackendUnavailableError } from '../mockPolicy';
import { MaterialItem, MaterialRequest } from '../../types';

const parseServiceOrderId = (serviceOrderId: string): number => {
  const digits = String(serviceOrderId || '').match(/\d+/)?.[0];
  const orderId = digits ? Number(digits) : NaN;
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error(`Invalid service order id: ${serviceOrderId}`);
  }
  return orderId;
};

export const materialService = {
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

  createMaterialRequest: async (
    serviceOrderId: string,
    items: { productId: number; quantity: number }[]
  ): Promise<{ id: number; totalAmount: number; items: MaterialItem[] }> => {
    try {
      const numericOrderId = parseServiceOrderId(serviceOrderId);
      const response = await apiClient.post<any>(ENDPOINTS.DELIVERY.MATERIAL_REQUEST(numericOrderId), {
        storeId: 1,
        items: items,
      });
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
          price: reqItem.price || 0,
          quantity: reqItem.quantity || matchingRequest?.quantity || 0,
        };
      });

      const totalAmount = mappedItems.reduce((acc: number, item: MaterialItem) => acc + item.price * item.quantity, 0);

      return {
        id: order.id,
        totalAmount: totalAmount,
        items: mappedItems,
      };
    } catch (error) {
      throw createBackendUnavailableError('Material request creation', error);
    }
  },

  fetchMaterialStatus: async (orderId: number): Promise<MaterialRequest['status']> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.DELIVERY.STATUS(orderId));
      const order = response.data;
      if (order.status === 'COLLECTED') return 'DELIVERED';
      if (order.status === 'READY_FOR_PICKUP' || order.status === 'PLUMBER_AT_STORE') return 'DELIVERING';
      if (order.status === 'CANCELLED') return 'REJECTED';
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
};

