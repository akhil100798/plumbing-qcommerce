import { Rider } from '../../types';
import { mockRiders } from '../../mocks';
import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

export const dispatchService = {
  getAvailableRiders: async (): Promise<Rider[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.delivery.partners);
      return (response.data || []).map((user: any) => ({
        id: user.id,
        fullName: user.fullName || user.email || 'Delivery Partner',
        phone: user.phone || '9999999999',
        rating: 4.8,
        vehicleNumber: 'TS-09-EQ-4521',
        latitude: 17.4485,
        longitude: 78.3741,
        status: 'AVAILABLE',
      }));
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store dispatch rider list', error);
        return mockRiders;
      }
      throw createBackendUnavailableError('Store dispatch rider list', error);
    }
  },

  assignRider: async (orderId: number, riderId: number): Promise<Rider> => {
    try {
      // POST /api/v1/delivery/{orderId}/assign?partnerId={riderId}
      const response = await apiClient.post<any>(
        `${ENDPOINTS.delivery.partners.replace('/partners', '')}/${orderId}/assign?partnerId=${riderId}`
      );
      const order = response.data;
      const partner = order.deliveryPartner || {};
      return {
        id: partner.id || riderId,
        fullName: partner.fullName || 'Assigned Partner',
        phone: partner.phone || '9999999999',
        rating: 4.8,
        vehicleNumber: 'TS-09-EQ-4521',
        latitude: 17.4485,
        longitude: 78.3741,
        status: 'BUSY',
      };
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store dispatch rider assignment', error);
        const rider = mockRiders.find((r) => r.id === riderId);
        if (!rider) throw new Error('Rider not found');
        return rider;
      }
      throw createBackendUnavailableError('Store dispatch rider assignment', error);
    }
  },
};
