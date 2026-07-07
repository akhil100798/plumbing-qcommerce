import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Product } from '../../types';
import { mockProducts } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

export const analyticsService = {
  getSalesAnalytics: async (): Promise<{ revenue: number; orders: number; averageOrderValue: number; trend: any[] }> => {
    try {
      const response = await apiClient.get(ENDPOINTS.dashboard.metrics);
      const metrics = response.data;
      return {
        revenue: metrics.dailyRevenue || 0,
        orders: metrics.ordersToday || 0,
        averageOrderValue: metrics.ordersToday > 0 ? (metrics.dailyRevenue / metrics.ordersToday) : 0,
        trend: metrics.ordersTrend || []
      };
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store analytics summary', e);
        return {
          revenue: 18540,
          orders: 12,
          averageOrderValue: 1545,
          trend: [
            { date: 'Mon', orders: 8 },
            { date: 'Tue', orders: 15 },
            { date: 'Wed', orders: 12 },
            { date: 'Thu', orders: 10 },
            { date: 'Fri', orders: 14 },
            { date: 'Sat', orders: 20 },
            { date: 'Sun', orders: 12 }
          ]
        };
      }
      throw createBackendUnavailableError('Store analytics', e);
    }
  },

  getTopProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.dashboard.forecast);
      const list = response.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.slice(0, 3).map((item: any, index: number) => ({
          id: item.id || index + 1,
          sku: item.sku || `SKU-${index + 1}`,
          name: item.name || `Product ${index + 1}`,
          description: item.description,
          price: item.price || 0,
          mrp: item.mrp || item.price || 0,
          imageUrl: item.imageUrl,
          categoryId: item.categoryId || 1,
          categoryName: item.categoryName || 'General',
          stock: item.stock || 0,
        }));
      }
      return [];
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store top products analytics', e);
        return mockProducts.slice(0, 3);
      }
      throw createBackendUnavailableError('Store top products analytics', e);
    }
  }
};
