import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_ACTIVE_JOB, MOCK_JOB_OFFER } from '../mocks/mockData';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { ActiveJob, JobOffer } from '../../types';

const fallbackLocation = (order: any) => {
  if (order.customerLatitude != null && order.customerLongitude != null) {
    return `Lat ${Number(order.customerLatitude).toFixed(4)}, Lng ${Number(order.customerLongitude).toFixed(4)}`;
  }
  return 'Customer service location';
};

const parseServiceOrderId = (jobId: string): number => {
  const digits = String(jobId || '').match(/\d+/)?.[0];
  const orderId = digits ? Number(digits) : NaN;
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error(`Invalid service order id: ${jobId}`);
  }
  return orderId;
};

const mapServiceOrderToOffer = (order: any): JobOffer => ({
  jobId: String(order.id),
  customerId: String(order.customer?.id || order.customerId || ''),
  customerName: order.customer?.fullName || order.customerName || 'Customer',
  customerRating: 4.8,
  distance: 2.4,
  location: fallbackLocation(order),
  latitude: Number(order.customerLatitude ?? order.latitude ?? 17.4485),
  longitude: Number(order.customerLongitude ?? order.longitude ?? 78.3741),
  estimatedEarnings: Number(order.totalAmount ?? order.serviceCharge ?? 299),
  issueDescription: order.description,
  category: order.requestType || 'Service',
});

const mapServiceOrderToActiveJob = (order: any, status?: ActiveJob['status']): ActiveJob => {
  let mappedStatus: ActiveJob['status'] = status || 'accepted';
  if (!status) {
    if (order.status === 'ACCEPTED') {
      mappedStatus = order.arrivedAt != null ? 'reached' : 'accepted';
    } else if (order.status === 'IN_PROGRESS' || order.status === 'COMBINED_ORDER') {
      mappedStatus = 'started';
    } else if (order.status === 'COMPLETED' || order.status === 'PAID') {
      mappedStatus = 'completed';
    }
  } else if (status === 'accepted' && order.arrivedAt != null) {
    mappedStatus = 'reached';
  }

  return {
    jobId: String(order.id),
    customer: {
      id: String(order.customer?.id || order.customerId || ''),
      fullName: order.customer?.fullName || order.customerName || 'Customer',
      phone: order.customer?.phone || order.customerPhone || '',
      rating: 4.8,
    },
    status: mappedStatus,
    address: fallbackLocation(order),
    latitude: Number(order.customerLatitude ?? order.latitude ?? 17.4485),
    longitude: Number(order.customerLongitude ?? order.longitude ?? 78.3741),
    customerNote: order.description,
    estimatedEarnings: Number(order.totalAmount ?? order.serviceCharge ?? 299),
    partsCharge: Number(order.partsCharge ?? 0),
    timeline: {
      accepted: order.acceptedAt,
      reached: order.arrivedAt,
      started: order.startedAt,
      completed: order.completedAt,
    },
  };
};

export const jobService = {
  fetchIncomingJobs: async (): Promise<JobOffer[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.ORDERS.BY_STATUS('PENDING'));
      return (response.data || []).map(mapServiceOrderToOffer);
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Fetch incoming jobs', error);
        return [MOCK_JOB_OFFER];
      }
      throw createBackendUnavailableError('Fetch incoming jobs', error);
    }
  },

  acceptJob: async (jobId: string): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.patch<any>(ENDPOINTS.ORDERS.ACCEPT(cleanId));
      return mapServiceOrderToActiveJob(response.data, 'accepted');
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Accept plumber job', error);
        return {
          ...MOCK_ACTIVE_JOB,
          jobId,
          timeline: {
            assigned: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            accepted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
      throw createBackendUnavailableError('Accept plumber job', error);
    }
  },

  startNavigation: async (jobId: string): Promise<void> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      await apiClient.patch<any>(`/orders/${cleanId}/start-navigation`);
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Start navigation', error);
        return;
      }
      throw createBackendUnavailableError('Start navigation', error);
    }
  },

  markArrived: async (jobId: string): Promise<void> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      await apiClient.patch<any>(ENDPOINTS.ORDERS.ARRIVE(cleanId));
    } catch (error) {
      throw createBackendUnavailableError('Mark arrived', error);
    }
  },

  startWork: async (jobId: string): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.patch<any>(ENDPOINTS.ORDERS.START(cleanId));
      return mapServiceOrderToActiveJob(response.data, 'started');
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Start plumber job', error);
        return {
          ...MOCK_ACTIVE_JOB,
          jobId,
          status: 'started',
          timeline: {
            ...MOCK_ACTIVE_JOB.timeline,
            started: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
      throw createBackendUnavailableError('Start plumber job', error);
    }
  },

  completeJob: async (jobId: string, partsCharge?: number): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.patch<any>(
        `${ENDPOINTS.ORDERS.COMPLETE(cleanId)}?partsCharge=${partsCharge || 0}`
      );
      return mapServiceOrderToActiveJob(response.data, 'completed');
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Complete plumber job', error);
        return {
          ...MOCK_ACTIVE_JOB,
          jobId,
          status: 'completed',
          partsCharge: partsCharge || 0,
          timeline: {
            ...MOCK_ACTIVE_JOB.timeline,
            completed: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
      throw createBackendUnavailableError('Complete plumber job', error);
    }
  },

  fetchActiveJob: async (): Promise<ActiveJob | null> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.ORDERS.PLUMBER_ASSIGNED);
      const orders = response.data || [];
      const sortedOrders = [...orders].sort((a, b) => Number(b.id) - Number(a.id));
      const activeOrder = sortedOrders.find(
        (order) =>
          order.status === 'ACCEPTED' ||
          order.status === 'IN_PROGRESS' ||
          order.status === 'COMBINED_ORDER'
      );
      if (!activeOrder) return null;

      // Let mapServiceOrderToActiveJob infer status from all fields (including arrivedAt)
      return mapServiceOrderToActiveJob(activeOrder);
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Fetch active job', error);
        return null;
      }
      throw createBackendUnavailableError('Fetch active job', error);
    }
  },

  fetchJobById: async (jobId: string): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.get<any>(ENDPOINTS.ORDERS.GET_BY_ID(cleanId));
      return mapServiceOrderToActiveJob(response.data);
    } catch (error) {
      throw createBackendUnavailableError('Fetch job by ID', error);
    }
  },
};
