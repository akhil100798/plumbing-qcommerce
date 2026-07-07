import { MaterialRequest } from '../../types';
import { mockMaterialRequests } from '../../mocks';
import { canUseDevMockFallbacks, createUnsupportedBackendError, warnUsingDevMockFallback } from '../mockPolicy';

let localMaterialRequests = [...mockMaterialRequests];

export const materialRequestService = {
  getMaterialRequests: async (): Promise<MaterialRequest[]> => {
    if (canUseDevMockFallbacks()) {
      warnUsingDevMockFallback('Store material request list', new Error('dev-only material request fallback'));
      return localMaterialRequests;
    }
    throw createUnsupportedBackendError('Store material requests');
  },

  prepareOrder: async (requestId: number): Promise<MaterialRequest> => {
    if (canUseDevMockFallbacks()) {
      warnUsingDevMockFallback('Store material request prepare', new Error(String(requestId)));
      const idx = localMaterialRequests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        localMaterialRequests[idx] = { ...localMaterialRequests[idx], status: 'READY' };
        return localMaterialRequests[idx];
      }
      throw new Error('Request not found');
    }
    throw createUnsupportedBackendError('Store material request preparation');
  }
};
