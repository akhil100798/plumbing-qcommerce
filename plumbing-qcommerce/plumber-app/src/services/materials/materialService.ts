import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_CATALOG } from '../mocks/mockData';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { MaterialItem, MaterialRequest } from '../../types';

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
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Material search', error);
        return MOCK_CATALOG.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      throw createBackendUnavailableError('Material catalog search', error);
    }
  },

  createMaterialRequest: async (
    serviceOrderId: string,
    items: { productId: number; quantity: number }[]
  ): Promise<{ id: number; totalAmount: number; items: MaterialItem[] }> => {
    try {
      const numericOrderId = parseInt(serviceOrderId.replace(/[^0-9]/g, '')) || 1;
      const response = await apiClient.post<any>(ENDPOINTS.DELIVERY.MATERIAL_REQUEST, {
        serviceOrderId: numericOrderId,
        storeId: 1,
        items: items,
      });

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
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Create material request', error);
        const mockId = Math.floor(Math.random() * 100000);
        const mappedItems = items.map((reqItem) => {
          const catalogItem = MOCK_CATALOG.find((c) => c.productId === reqItem.productId);
          return {
            productId: reqItem.productId,
            name: catalogItem?.name || `Product #${reqItem.productId}`,
            price: catalogItem?.price || 50,
            quantity: reqItem.quantity,
          };
        });
        const totalAmount = mappedItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
        return {
          id: mockId,
          totalAmount,
          items: mappedItems,
        };
      }
      throw createBackendUnavailableError('Material request creation', error);
    }
  },

  fetchMaterialStatus: async (orderId: number): Promise<MaterialRequest['status']> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.DELIVERY.STATUS(orderId));
      const order = response.data;
      if (order.status === 'DELIVERED') return 'DELIVERED';
      if (order.status === 'OUT_FOR_DELIVERY') return 'DELIVERING';
      if (order.status === 'CANCELLED') return 'REJECTED';
      return 'APPROVED';
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Material request status', error);
        return 'PENDING_APPROVAL';
      }
      throw createBackendUnavailableError('Material request status', error);
    }
  },
};

