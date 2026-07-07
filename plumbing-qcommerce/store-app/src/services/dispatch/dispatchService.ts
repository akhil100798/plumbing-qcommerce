import { Rider } from '../../types';
import { mockRiders } from '../../mocks';
import { canUseDevMockFallbacks, createUnsupportedBackendError, warnUsingDevMockFallback } from '../mockPolicy';

export const dispatchService = {
  getAvailableRiders: async (): Promise<Rider[]> => {
    if (canUseDevMockFallbacks()) {
      warnUsingDevMockFallback('Store dispatch rider list', new Error('dev-only dispatch fallback'));
      return mockRiders;
    }
    throw createUnsupportedBackendError('Dispatch rider lookup');
  },

  assignRider: async (orderId: number, riderId: number): Promise<Rider> => {
    if (canUseDevMockFallbacks()) {
      warnUsingDevMockFallback('Store dispatch rider assignment', new Error(`order ${orderId}`));
      const rider = mockRiders.find(r => r.id === riderId);
      if (!rider) throw new Error('Rider not found');
      return rider;
    }
    throw createUnsupportedBackendError('Dispatch rider assignment');
  }
};
