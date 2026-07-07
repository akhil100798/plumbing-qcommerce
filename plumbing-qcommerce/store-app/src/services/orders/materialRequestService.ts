import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MaterialRequest } from '../../types';
import { mockMaterialRequests } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  createUnsupportedBackendError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { storeService } from '../store/storeService';

let localMaterialRequests = [...mockMaterialRequests];

const mapBackendStatus = (status: string): MaterialRequest['status'] => {
  switch (status) {
    case 'CONFIRMED':
      return 'PENDING';
    case 'PACKING':
    case 'READY_FOR_PICKUP':
      return 'PREPARING';
    case 'OUT_FOR_DELIVERY':
    case 'DELIVERED':
      return 'COMPLETED';
    default:
      return 'PENDING';
  }
};

const mapRequest = (request: any): MaterialRequest => ({
  id: request.id,
  serviceOrderId: Number(request.serviceOrderId || 0),
  storeId: Number(request.storeId || 0),
  plumberId: 0,
  plumberName: request.assignedPlumberName || 'Assigned plumber',
  items: (request.items || []).map((item: any) => ({
    productId: item.productId,
    productName: item.productName || 'Item',
    quantity: item.quantity,
    price: Number(item.price || 0),
  })),
  totalAmount: Number(request.totalAmount || 0),
  status: mapBackendStatus(request.status),
  createdAt: request.createdAt || new Date().toISOString(),
});

export const materialRequestService = {
  getMaterialRequests: async (): Promise<MaterialRequest[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.materialRequests.store);
      const mapped = (response.data || []).map(mapRequest);
      localMaterialRequests = mapped;
      return mapped;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store material request list', e);
        return localMaterialRequests;
      }
      throw createBackendUnavailableError('Store material requests', e);
    }
  },

  prepareOrder: async (requestId: number): Promise<MaterialRequest> => {
    try {
      const storeProfile = await storeService.getCurrentStoreProfile();
      const response = await apiClient.patch(ENDPOINTS.orders.accept(requestId), { storeId: storeProfile.id });
      return mapRequest(response.data);
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store material request prepare', new Error(String(requestId)));
        const idx = localMaterialRequests.findIndex((request) => request.id === requestId);
        if (idx !== -1) {
          localMaterialRequests[idx] = { ...localMaterialRequests[idx], status: 'PREPARING' };
          return localMaterialRequests[idx];
        }
        throw new Error('Request not found');
      }
      throw createBackendUnavailableError('Store material request preparation', e);
    }
  },

  completePreparation: async (requestId: number): Promise<MaterialRequest> => {
    try {
      const storeProfile = await storeService.getCurrentStoreProfile();
      const response = await apiClient.patch(ENDPOINTS.orders.pack(requestId), { storeId: storeProfile.id });
      return mapRequest(response.data);
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store material request complete preparation', new Error(String(requestId)));
        const idx = localMaterialRequests.findIndex((request) => request.id === requestId);
        if (idx !== -1) {
          localMaterialRequests[idx] = { ...localMaterialRequests[idx], status: 'COMPLETED' };
          return localMaterialRequests[idx];
        }
        throw new Error('Request not found');
      }
      throw createUnsupportedBackendError('Store material request pack transition');
    }
  }
};
