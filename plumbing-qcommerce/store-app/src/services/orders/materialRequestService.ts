import { MaterialRequest } from '../../types';
import { mockMaterialRequests } from '../../mocks';

let localMaterialRequests = [...mockMaterialRequests];

export const materialRequestService = {
  getMaterialRequests: async (): Promise<MaterialRequest[]> => {
    // Return plumber mid-job requests
    return localMaterialRequests;
  },

  prepareOrder: async (requestId: number): Promise<MaterialRequest> => {
    const idx = localMaterialRequests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      localMaterialRequests[idx] = { ...localMaterialRequests[idx], status: 'READY' };
      return localMaterialRequests[idx];
    }
    throw new Error('Request not found');
  }
};
