import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_CATALOG } from '../mocks/mockData';
import { MaterialItem, MaterialRequest } from '../../types';

export const materialService = {
  searchMaterials: async (query: string): Promise<MaterialItem[]> => {
    try {
      // Fetch catalog products from catalog search API if exists
      const response = await apiClient.get<any[]>(`${ENDPOINTS.CATALOG.SEARCH}?q=${query}`);
      return response.data.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: 0,
        image: item.imageUrl,
      }));
    } catch (error) {
      console.warn('Catalog API search failed, using mock list', error);
      return MOCK_CATALOG.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  createMaterialRequest: async (
    serviceOrderId: string,
    items: { productId: number; quantity: number }[]
  ): Promise<{ id: number; totalAmount: number; items: MaterialItem[] }> => {
    try {
      // Call POST /api/v1/delivery/material-request
      // Convert serviceOrderId to number if possible
      const numericOrderId = parseInt(serviceOrderId.replace(/[^0-9]/g, '')) || 1;
      const response = await apiClient.post<any>(ENDPOINTS.DELIVERY.MATERIAL_REQUEST, {
        serviceOrderId: numericOrderId,
        storeId: 1, // Default warehouse store
        items: items,
      });

      const order = response.data;
      
      // Map back to our structure
      const mappedItems = items.map((reqItem) => {
        const catalogItem = MOCK_CATALOG.find((c) => c.productId === reqItem.productId);
        return {
          productId: reqItem.productId,
          name: catalogItem?.name || `Product #${reqItem.productId}`,
          price: catalogItem?.price || 50,
          quantity: reqItem.quantity,
        };
      });

      const totalAmount = mappedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      return {
        id: order.id,
        totalAmount: totalAmount,
        items: mappedItems,
      };
    } catch (error) {
      console.warn('Failed to post material request to API, using mock callback', error);
      // Simulate success callback
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
      const totalAmount = mappedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      return {
        id: mockId,
        totalAmount,
        items: mappedItems,
      };
    }
  },

  fetchMaterialStatus: async (orderId: number): Promise<MaterialRequest['status']> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.DELIVERY.STATUS(orderId));
      const order = response.data;
      // Map order status to MaterialRequest['status']
      // ORDER_CONFIRMED, STORE_ACCEPTED, OUT_FOR_DELIVERY, DELIVERED, etc.
      if (order.status === 'DELIVERED') return 'DELIVERED';
      if (order.status === 'OUT_FOR_DELIVERY') return 'DELIVERING';
      if (order.status === 'CANCELLED') return 'REJECTED';
      return 'APPROVED';
    } catch (error) {
      console.warn('Failed to fetch material status from API', error);
      return 'PENDING_APPROVAL';
    }
  },
};
