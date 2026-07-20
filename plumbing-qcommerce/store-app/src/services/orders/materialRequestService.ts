import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MaterialRequest } from '../../types';
import { createBackendUnavailableError } from '../mockPolicy';

let localMaterialRequests: MaterialRequest[] = [];

const mapBackendStatus = (status: string): MaterialRequest['status'] => {
  switch (status) {
    case 'REQUESTED':
    case 'STORE_REVIEWING':
      return 'PENDING';
    case 'RESERVED':
    case 'PREPARING':
      return 'PREPARING';
    case 'READY_FOR_PICKUP':
      return 'READY';
    case 'COLLECTED':
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

const updateLocalRequest = (updated: MaterialRequest) => {
  const idx = localMaterialRequests.findIndex((request) => request.id === updated.id);
  if (idx !== -1) {
    localMaterialRequests[idx] = updated;
  }
};

export const materialRequestService = {
  getMaterialRequests: async (): Promise<MaterialRequest[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.materialRequests.store);
      const mapped = (response.data || []).map(mapRequest);
      localMaterialRequests = mapped;
      return mapped;
    } catch (e) {
      throw createBackendUnavailableError('Store material requests', e);
    }
  },

  prepareOrder: async (requestId: number): Promise<MaterialRequest> => {
    try {
      await apiClient.post(ENDPOINTS.materialRequests.approve(requestId));
      await apiClient.post(ENDPOINTS.materialRequests.reserve(requestId));
      const response = await apiClient.post(ENDPOINTS.materialRequests.prepare(requestId));
      const mapped = mapRequest(response.data);
      updateLocalRequest(mapped);
      return mapped;
    } catch (e) {
      throw createBackendUnavailableError('Store material request preparation', e);
    }
  },

  completePreparation: async (requestId: number): Promise<MaterialRequest> => {
    try {
      const response = await apiClient.post(ENDPOINTS.materialRequests.ready(requestId));
      const mapped = mapRequest(response.data);
      updateLocalRequest(mapped);
      return mapped;
    } catch (e) {
      throw createBackendUnavailableError('Store material request pickup readiness', e);
    }
  }
};
